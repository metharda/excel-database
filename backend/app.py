import os
import json
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import pandas as pd
from werkzeug.utils import secure_filename
import redis
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)
load_dotenv()

app = Flask(__name__)
CORS(app)

db_path = os.path.join(DATA_DIR, "databases.db")
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
    "DATABASE_URL", f"sqlite:///{db_path}"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["UPLOAD_FOLDER"] = os.getenv("UPLOAD_FOLDER", "uploads")
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024

try:
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    redis_client = redis.from_url(redis_url, decode_responses=True)
    redis_client.ping()
    print("✅ Redis connection successful")
except Exception as e:
    print(f"⚠️  Redis connection failed: {e}")
    redis_client = None

os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

db = SQLAlchemy(app)


class DynamicTable(db.Model):
    __tablename__ = "dynamic_tables"
    id = db.Column(db.Integer, primary_key=True)
    table_name = db.Column(db.String(100), unique=True, nullable=False)
    columns = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class DataRecord(db.Model):
    __tablename__ = "data_records"
    id = db.Column(db.Integer, primary_key=True)
    table_name = db.Column(db.String(100), nullable=False)
    data = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


with app.app_context():
    db.create_all()


def normalize_column_name(col):
    return col.strip().lower().replace(" ", "_").replace("-", "_")


def get_table_columns(table_name):
    table = DynamicTable.query.filter_by(table_name=table_name).first()
    if table:
        return json.loads(table.columns)
    return None


def create_or_update_table(df, table_name):
    df.columns = [normalize_column_name(col) for col in df.columns]
    columns = df.columns.tolist()
    existing_table = DynamicTable.query.filter_by(table_name=table_name).first()
    if existing_table:
        existing_cols = set(json.loads(existing_table.columns))
        new_cols = set(columns)
        if existing_cols == new_cols:
            for _, row in df.iterrows():
                record = DataRecord(
                    table_name=table_name,
                    data=json.dumps(row.to_dict(), ensure_ascii=False),
                )
                db.session.add(record)
        else:
            base_name = table_name
            counter = 1
            while DynamicTable.query.filter_by(
                table_name=f"{base_name}_{counter}"
            ).first():
                counter += 1
            table_name = f"{base_name}_{counter}"
            new_table = DynamicTable(
                table_name=table_name, columns=json.dumps(columns, ensure_ascii=False)
            )
            db.session.add(new_table)
            for _, row in df.iterrows():
                record = DataRecord(
                    table_name=table_name,
                    data=json.dumps(row.to_dict(), ensure_ascii=False),
                )
                db.session.add(record)
    else:
        new_table = DynamicTable(
            table_name=table_name, columns=json.dumps(columns, ensure_ascii=False)
        )
        db.session.add(new_table)
        for _, row in df.iterrows():
            record = DataRecord(
                table_name=table_name,
                data=json.dumps(row.to_dict(), ensure_ascii=False),
            )
            db.session.add(record)
    db.session.commit()
    return table_name


@app.route("/api/tables", methods=["GET"])
def get_tables():
    tables = DynamicTable.query.all()
    result = []
    for table in tables:
        record_count = DataRecord.query.filter_by(table_name=table.table_name).count()
        result.append(
            {
                "id": table.id,
                "name": table.table_name,
                "columns": json.loads(table.columns),
                "record_count": record_count,
                "created_at": table.created_at.isoformat(),
            }
        )
    return jsonify(result)


@app.route("/api/tables/<table_name>", methods=["GET"])
def get_table_data(table_name):
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 50, type=int)
    search = request.args.get("search", "")
    table = DynamicTable.query.filter_by(table_name=table_name).first()
    if not table:
        return jsonify({"error": "Table not found"}), 404
    query = DataRecord.query.filter_by(table_name=table_name)
    if search:
        search_filter = DataRecord.data.contains(search)
        query = query.filter(search_filter)
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    records = []
    for record in paginated.items:
        records.append({"id": record.id, "data": json.loads(record.data)})
    return jsonify(
        {
            "table_name": table_name,
            "columns": json.loads(table.columns),
            "records": records,
            "total": paginated.total,
            "pages": paginated.pages,
            "current_page": page,
        }
    )


@app.route("/api/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "File not found"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    if file and file.filename.endswith((".xlsx", ".xls", ".csv")):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(filepath)
        try:
            if filename.endswith(".csv"):
                df = pd.read_csv(filepath)
            else:
                excel_file = pd.ExcelFile(filepath)
                tables_created = []
                for sheet_name in excel_file.sheet_names:
                    df = pd.read_excel(filepath, sheet_name=sheet_name)
                    if not df.empty:
                        table_name = (
                            f"{filename.rsplit('.', 1)[0]}_{sheet_name}".replace(
                                " ", "_"
                            )
                        )
                        created_table = create_or_update_table(df, table_name)
                        tables_created.append(created_table)
                os.remove(filepath)
                return jsonify(
                    {"message": "File uploaded successfully", "tables": tables_created}
                )
            if not df.empty:
                table_name = filename.rsplit(".", 1)[0].replace(" ", "_")
                created_table = create_or_update_table(df, table_name)
                os.remove(filepath)
                return jsonify(
                    {"message": "File uploaded successfully", "tables": [created_table]}
                )
        except Exception as e:
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({"error": str(e)}), 500
    return jsonify({"error": "Invalid file format"}), 400


@app.route("/api/search", methods=["GET"])
def search():
    query = request.args.get("q", "")
    limit = request.args.get("limit", 1000)
    try:
        limit = int(limit)
    except:
        limit = 1000

    if not query:
        return jsonify({"results": []})
    results = []
    tables = DynamicTable.query.all()
    for table in tables:
        records = (
            DataRecord.query.filter(
                DataRecord.table_name == table.table_name,
                DataRecord.data.contains(query),
            )
            .limit(limit)
            .all()
        )
        for record in records:
            results.append({"table": table.table_name, "data": json.loads(record.data)})
    return jsonify({"results": results})


@app.route("/api/export/<table_name>", methods=["GET"])
def export_table(table_name):
    table = DynamicTable.query.filter_by(table_name=table_name).first()
    if not table:
        return jsonify({"error": "Table not found"}), 404
    
    # Get format parameter (default to xlsx)
    format_type = request.args.get("format", "xlsx").lower()
    if format_type not in ["xlsx", "csv"]:
        return jsonify({"error": "Invalid format. Use 'xlsx' or 'csv'"}), 400
    
    records = DataRecord.query.filter_by(table_name=table_name).all()
    data = [json.loads(record.data) for record in records]
    df = pd.DataFrame(data)
    
    if format_type == "csv":
        output_path = os.path.join(app.config["UPLOAD_FOLDER"], f"{table_name}_export.csv")
        df.to_csv(output_path, index=False, encoding='utf-8')
        download_name = f"{table_name}.csv"
    else:  # xlsx
        output_path = os.path.join(app.config["UPLOAD_FOLDER"], f"{table_name}_export.xlsx")
        df.to_excel(output_path, index=False)
        download_name = f"{table_name}.xlsx"
    
    return send_file(
        output_path, as_attachment=True, download_name=download_name
    )


@app.route("/api/delete/<table_name>", methods=["DELETE"])
def delete_table(table_name):
    table = DynamicTable.query.filter_by(table_name=table_name).first()
    if not table:
        return jsonify({"error": "Table not found"}), 404
    DataRecord.query.filter_by(table_name=table_name).delete()
    db.session.delete(table)
    db.session.commit()
    return jsonify({"message": "Table deleted successfully"})


def create_sample_data():
    if not DynamicTable.query.first():
        sample_table = DynamicTable(
            table_name="sample_data",
            columns=json.dumps(["name", "url", "info", "note"]),
        )
        db.session.add(sample_table)
        sample_data = [
            {
                "name": "BYS",
                "url": "bys.marmara.edu.tr",
                "info": "Information Management System",
                "note": "Student affairs automation",
            },
            {
                "name": "OBS",
                "url": "obs.marmara.edu.tr",
                "info": "Student Information System",
                "note": "Course registration and grade viewing",
            },
            {
                "name": "UZEM",
                "url": "uzem.marmara.edu.tr",
                "info": "Distance Education Center",
                "note": "Online course platform",
            },
        ]
        for data in sample_data:
            record = DataRecord(
                table_name="sample_data", data=json.dumps(data, ensure_ascii=False)
            )
            db.session.add(record)
        db.session.commit()

@app.route("/api/rename_table", methods=["POST"])
def rename_table():
    data = request.get_json()
    old_name = data.get("old_name")
    new_name = data.get("new_name")
    if not old_name or not new_name:
        return jsonify({"error": "Both old_name and new_name are required."}), 400
    table = DynamicTable.query.filter_by(table_name=old_name).first()
    if not table:
        return jsonify({"error": "Table not found."}), 404
    if DynamicTable.query.filter_by(table_name=new_name).first():
        return jsonify({"error": "A table with the new name already exists."}), 400
    # Update table name in DynamicTable
    table.table_name = new_name
    # Update all DataRecord entries
    DataRecord.query.filter_by(table_name=old_name).update({"table_name": new_name})
    db.session.commit()
    return jsonify({"message": "Table renamed successfully."})


@app.route("/api/update_row", methods=["POST"])
def update_row():
    data = request.get_json()
    row_id = data.get("id")
    table_name = data.get("table_name")
    new_data = data.get("data")
    if not row_id or not table_name or not new_data:
        return jsonify({"error": "id, table_name, and data are required."}), 400
    record = DataRecord.query.filter_by(id=row_id, table_name=table_name).first()
    if not record:
        return jsonify({"error": "Row not found."}), 404
    record.data = json.dumps(new_data, ensure_ascii=False)
    db.session.commit()
    return jsonify({"message": "Row updated successfully."})

if __name__ == "__main__":
    with app.app_context():
        create_sample_data()
    app.run(host="0.0.0.0", debug=False, port=5000)
