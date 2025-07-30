#!/usr/bin/env python3
import asyncio
import websockets
import json
import os
import sys
from pathlib import Path


class CLITerminalServer:
    def __init__(self):
        self.connections = set()
        self.cli_path = Path(__file__).parent / "cli.py"

    async def register(self, websocket):
        self.connections.add(websocket)
        await self.send_welcome_message(websocket)

    async def unregister(self, websocket):
        self.connections.discard(websocket)

    async def send_welcome_message(self, websocket):
        welcome_msg = {
            "type": "output",
            "data": """
╔══════════════════════════════════════════════════════════════╗
║                    Excel Database CLI Terminal               ║
║                                                              ║
║  Available commands:                                         ║
║  • list-tables        - List all tables                      ║
║  • show <table>       - Show table data                      ║
║  • search <query>     - Search in tables                     ║
║  • upload <file>      - Upload Excel file                    ║
║  • export <table>     - Export table to Excel                ║
║  • delete <table>     - Delete table                         ║
║  • help               - Show help                            ║
║  • clear              - Clear screen                         ║
║                                                              ║
║  Example: show customers                                     ║
╚══════════════════════════════════════════════════════════════╝

Excel Database CLI > """,
            "prompt": True,
        }
        await websocket.send(json.dumps(welcome_msg))

    async def execute_command(self, command, websocket):
        if command.strip() == "clear":
            await websocket.send(json.dumps({"type": "clear"}))
            await self.send_welcome_message(websocket)
            return

        if command.strip() == "help":
            help_msg = {
                "type": "output",
                "data": """
Available Commands:
══════════════════

list-tables              - List all tables
show <table_name>        - Show the specified table
search <search_term>     - Search in all tables
upload <file_path>       - Upload Excel file
export <table_name>      - Download table in Excel format
delete <table_name>      - Delete table
help                     - Show this help message
clear                    - Clear terminal screen

Examples:
─────────
show customers
search "John Doe"
upload /path/to/file.xlsx
export sales_data
delete old_table

Excel Database CLI > """,
                "prompt": True,
            }
            await websocket.send(json.dumps(help_msg))
            return

        try:
            cmd_parts = command.strip().split()
            if not cmd_parts:
                await websocket.send(
                    json.dumps(
                        {
                            "type": "output",
                            "data": "Excel Database CLI > ",
                            "prompt": True,
                        }
                    )
                )
                return

            full_command = [sys.executable, str(self.cli_path)] + cmd_parts

            process = await asyncio.create_subprocess_exec(
                *full_command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env={**os.environ, "PYTHONUNBUFFERED": "1"},
            )

            stdout, stderr = await process.communicate()

            output = ""
            if stdout:
                output += stdout.decode("utf-8")
            if stderr:
                output += f"\nError: {stderr.decode('utf-8')}"

            if not output.strip():
                output = "Command executed successfully."

            await websocket.send(
                json.dumps(
                    {
                        "type": "output",
                        "data": output + "\n\nExcel Database CLI > ",
                        "prompt": True,
                    }
                )
            )

        except Exception as e:
            error_msg = {
                "type": "output",
                "data": f"Error while executing command: {str(e)}\n\nExcel Database CLI > ",
                "prompt": True,
            }
            await websocket.send(json.dumps(error_msg))

    async def handle_client(self, websocket, path):
        await self.register(websocket)
        try:
            async for message in websocket:
                data = json.loads(message)
                if data.get("type") == "command":
                    await self.execute_command(data.get("command", ""), websocket)
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            await self.unregister(websocket)


async def main():
    server = CLITerminalServer()

    print("CLI Terminal Server is starting...")
    print("WebSocket server is listening on port 8080...")

    start_server = websockets.serve(
        server.handle_client, "0.0.0.0", 8080, ping_interval=20, ping_timeout=10
    )

    await start_server
    print("CLI Terminal Server is ready!")

    await asyncio.Future()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nCLI Terminal Server is shutting down...")
    except Exception as e:
        print(f"Server error: {e}")
        sys.exit(1)
