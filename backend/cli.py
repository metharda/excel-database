#!/usr/bin/env python3
import click
import requests
import json
from tabulate import tabulate
from colorama import init, Fore, Style
import os

init()

API_URL = os.environ.get("CLI_API_URL", "http://localhost:5000/api")


class DatabaseCLI:
    def __init__(self):
        self.current_table = None

    def print_success(self, message):
        print(f"{Fore.GREEN}{message}{Style.RESET_ALL}")

    def print_error(self, message):
        print(f"{Fore.RED}{message}{Style.RESET_ALL}")

    def print_info(self, message):
        print(f"{Fore.CYAN}{message}{Style.RESET_ALL}")

    def print_table_header(self, title):
        print(f"\n{Fore.YELLOW}{'='*60}{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}{title.center(60)}{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}{'='*60}{Style.RESET_ALL}\n")

    def list_tables(self):
        try:
            response = requests.get(f"{API_URL}/tables")
            tables = response.json()

            if not tables:
                self.print_info("No tables found.")
                return

            self.print_table_header("TABLES")

            table_data = []
            for table in tables:
                table_data.append(
                    [
                        table["name"],
                        table["record_count"],
                        ", ".join(table["columns"][:3])
                        + ("..." if len(table["columns"]) > 3 else ""),
                    ]
                )

            print(
                tabulate(
                    table_data,
                    headers=["Table Name", "Record Count", "Columns"],
                    tablefmt="grid",
                )
            )

        except Exception as e:
            self.print_error(f"Could not load tables: {str(e)}")

    def show_table(self, table_name, page=1, search=""):
        try:
            params = {"page": page, "per_page": 20}
            if search:
                params["search"] = search

            response = requests.get(f"{API_URL}/tables/{table_name}", params=params)

            if response.status_code == 404:
                self.print_error(f"Table '{table_name}' not found.")
                return

            data = response.json()

            if not data["records"]:
                self.print_info("No data found in this table.")
                return

            self.print_table_header(f"{table_name.upper()} TABLE")

            table_data = []
            for record in data["records"]:
                row = [record["data"].get(col, "-") for col in data["columns"]]
                table_data.append(row)

            print(
                tabulate(
                    table_data,
                    headers=data["columns"],
                    tablefmt="fancy_grid",
                    maxcolwidths=30,
                )
            )

            print(
                f"\n{Fore.CYAN}Page {data['current_page']}/{data['pages']} - Total {data['total']} records{Style.RESET_ALL}"
            )

            self.current_table = table_name

        except Exception as e:
            self.print_error(f"Could not show table: {str(e)}")

    def search_all(self, query):
        try:
            response = requests.get(f"{API_URL}/search", params={"q": query})
            results = response.json()["results"]

            if not results:
                self.print_info(f"No results found for '{query}'.")
                return

            self.print_table_header(f"SEARCH RESULTS FOR '{query}'")

            for result in results:
                print(f"{Fore.GREEN}Table: {result['table']}{Style.RESET_ALL}")
                for key, value in result["data"].items():
                    print(f"  {Fore.CYAN}{key}:{Style.RESET_ALL} {value}")
                print()

        except Exception as e:
            self.print_error(f"Search failed: {str(e)}")

    def upload_file(self, filepath):
        try:
            if not os.path.exists(filepath):
                self.print_error(f"File not found: {filepath}")
                return

            with open(filepath, "rb") as f:
                files = {"file": f}
                response = requests.post(f"{API_URL}/upload", files=files)

            if response.status_code == 200:
                data = response.json()
                self.print_success(
                    f"File uploaded! Created tables: {', '.join(data['tables'])}"
                )
            else:
                error = response.json().get("error", "Unknown error")
                self.print_error(f"Upload error: {error}")

        except Exception as e:
            self.print_error(f"Could not upload file: {str(e)}")

    def delete_table(self, table_name):
        try:
            confirm = click.confirm(
                f"Are you sure you want to delete the table '{table_name}'?"
            )
            if not confirm:
                return

            response = requests.delete(f"{API_URL}/delete/{table_name}")

            if response.status_code == 200:
                self.print_success(f"Table '{table_name}' deleted.")
            else:
                self.print_error("Could not delete table.")

        except Exception as e:
            self.print_error(f"Delete error: {str(e)}")

    # Added error handling for API requests
    def safe_api_request(self, url, method="GET", data=None, params=None, files=None):
        try:
            if method == "GET":
                response = requests.get(url, params=params)
            elif method == "POST":
                response = requests.post(url, json=data, files=files)
            elif method == "DELETE":
                response = requests.delete(url)
            else:
                raise ValueError("Unsupported HTTP method")
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            self.print_error(f"API request failed: {e}")
            return None


cli = DatabaseCLI()


@click.group()
def main():
    pass


@main.command("tables")
def tables():
    cli.list_tables()


main.add_command(tables, "list-tables")


@main.command("show")
@click.argument("table_name")
@click.option("--page", "-p", default=1, help="Page number")
@click.option("--search", "-s", default="", help="Search term")
def show(table_name, page, search):
    cli.show_table(table_name, page, search)


@main.command("search")
@click.argument("query")
def search(query):
    cli.search_all(query)


@main.command("upload")
@click.argument("filepath", type=click.Path(exists=True))
def upload(filepath):
    cli.upload_file(filepath)


@main.command("delete")
@click.argument("table_name")
def delete(table_name):
    cli.delete_table(table_name)


@main.command("export")
@click.argument("table_name")
@click.argument("output_path", required=False)
@click.option("--format", "-f", type=click.Choice(["xlsx", "csv"]), default="xlsx", help="Export format (xlsx or csv)")
def export(table_name, output_path, format):
    try:
        url = f"{API_URL}/export/{table_name}?format={format}"
        response = requests.get(url)
        if response.status_code == 200:
            if not output_path:
                output_path = f"{table_name}.{format}"
            with open(output_path, "wb") as f:
                f.write(response.content)
            cli.print_success(f"Table saved as '{output_path}' in {format.upper()} format.")
        else:
            cli.print_error("Could not export table.")
    except Exception as e:
        cli.print_error(f"Export error: {str(e)}")


@main.command("clear")
def clear():
    os.system("clear" if os.name == "posix" else "cls")


@main.command("help")
def help_cmd():
    click.echo(main.get_help(click.Context(main)))


@main.command()
def interactive():
    cli.print_info("Welcome to interactive mode! Type 'exit' to quit.")

    while True:
        try:
            prompt = f"{Fore.GREEN}db>{Style.RESET_ALL} "
            if cli.current_table:
                prompt = f"{Fore.GREEN}db/{cli.current_table}>{Style.RESET_ALL} "

            command = input(prompt).strip()

            if command.lower() in ["exit", "quit", "q"]:
                cli.print_info("Goodbye!")
                break

            elif command.lower() in ["help", "h", "?"]:
                print(
                    """
Commands:
  tables, t           - List tables
  use <table>         - Select table
  show [page]         - Show selected table
  search <term>       - Search in table
  searchall <term>    - Search all tables
  clear               - Clear screen
  exit, quit, q       - Exit
                """
                )

            elif command.lower() in ["tables", "t"]:
                cli.list_tables()

            elif command.lower().startswith("use "):
                table_name = command[4:].strip()
                cli.show_table(table_name)

            elif command.lower() == "show":
                if cli.current_table:
                    cli.show_table(cli.current_table)
                else:
                    cli.print_error("Select a table first (use <table_name>)")

            elif command.lower().startswith("show "):
                if cli.current_table:
                    try:
                        page = int(command[5:].strip())
                        cli.show_table(cli.current_table, page=page)
                    except ValueError:
                        cli.print_error("Invalid page number")
                else:
                    cli.print_error("Select a table first")

            elif command.lower().startswith("search "):
                search_term = command[7:].strip()
                if cli.current_table:
                    cli.show_table(cli.current_table, search=search_term)
                else:
                    cli.print_error("Select a table first")

            elif command.lower().startswith("searchall "):
                search_term = command[10:].strip()
                cli.search_all(search_term)

            elif command.lower() == "clear":
                os.system("clear" if os.name == "posix" else "cls")

            elif command:
                cli.print_error(
                    f"Unknown command: {command}. Type 'help' to see available commands."
                )

        except KeyboardInterrupt:
            print()
            cli.print_info("Type 'exit' to quit.")
        except Exception as e:
            cli.print_error(f"Error: {str(e)}")


if __name__ == "__main__":
    main()
