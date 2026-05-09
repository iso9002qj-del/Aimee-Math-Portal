from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import google.generativeai as genai
import json
import img2pdf
from datetime import datetime
import traceback

from dotenv import load_dotenv

# 加载 .env 环境变量
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "Infrastructure/.env"))

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

UPLOAD_FOLDER = "/Users/liqijiang/Library/CloudStorage/GoogleDrive-iso9002.qj@gmail.com/我的云端硬盘/Aimee_Uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# 从环境变量获取 API Key
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.0-flash-exp')

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{file.filename}"
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        ext = os.path.splitext(filename)[1].lower()
        if ext in ['.png', '.jpg', '.jpeg']:
            pdf_path = os.path.splitext(file_path)[0] + ".pdf"
            try:
                with open(pdf_path, "wb") as f:
                    f.write(img2pdf.convert(file_path))
            except Exception as e:
                print(f"❌ PDF error: {e}")
        return jsonify({"message": "OK", "path": UPLOAD_FOLDER}), 200

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message')
    week_num = data.get('week', 8) # Default to week 8
    try:
        curriculum_path = os.path.join(os.path.dirname(__file__), 'curriculum.json')
        with open(curriculum_path, 'r') as f:
            curriculum = json.load(f)
            weeks = curriculum.get('weeks', [])
            week_data = next((w for w in weeks if w['week'] == week_num), weeks[-1])
            topic = week_data['topic']
            methodology = week_data.get('methodology', '启发式思维')
        
        prompt = f"""
        你是数学助教小安，辅导12岁女孩艾米（12岁）。
        当前周：第{week_num}周
        课题：{topic}
        方法论指导：{methodology}
        
        规则：
        1. 保持亲切、耐心的语气。
        2. 采用启发式教学，绝对不要直接给出数学题的答案。
        3. 鼓励艾米分享她的思路，哪怕是错误的。
        4. 使用简单的语言，偶尔可以用表情符号。
        
        艾米说：{user_message}
        """
        response = model.generate_content(prompt)
        return jsonify({"reply": response.text})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"reply": "连接大脑失败"}), 500

if __name__ == '__main__':
    app.run(port=3003, host='0.0.0.0')
