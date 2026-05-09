import os
import json
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import google.generativeai as genai
from datetime import datetime
import img2pdf

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

# 1. 静态前端页面路由
@app.route('/')
def index():
    return render_template('index.html')

# 配置上传目录
UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

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

# 如果前端有直接引用 /curriculum.json，需要提供静态文件路由
@app.route('/curriculum.json')
def serve_curriculum():
    return send_from_directory(os.path.dirname(__file__), 'curriculum.json')

# 2. AI 聊天后端 API 路由
@app.route('/api/chat', methods=['POST', 'GET'])
def chat():
    if request.method == 'GET':
        return jsonify({"status": "Aimee AI Backend is Online", "env_check": "GEMINI_API_KEY" in os.environ})

    try:
        data = request.json
        user_message = data.get('message')
        week_num = data.get('week', 8)
        
        cur_dir = os.path.dirname(__file__)
        curriculum_path = os.path.join(cur_dir, 'curriculum.json')
        
        with open(curriculum_path, 'r', encoding='utf-8') as f:
            curriculum = json.load(f)
            weeks = curriculum.get('weeks', [])
            week_data = next((w for w in weeks if w['week'] == week_num), weeks[-1])

        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            return jsonify({"reply": "错误：云端 API Key 未配置。请设置 GEMINI_API_KEY。"}), 500

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        你是数学助教小安，辅导12岁女孩艾米。
        当前周：第{week_num}周
        课题：{week_data['topic']}
        方法论指导：{week_data.get('methodology', '启发式思维')}
        
        规则：
        1. 亲切耐心。
        2. 启发式教学，绝不直接给答案。
        3. 鼓励试错。
        
        艾米说：{user_message}
        """
        response = model.generate_content(prompt)
        return jsonify({"reply": response.text})
    except Exception as e:
        return jsonify({"reply": f"后端发生异常: {str(e)}"}), 500

if __name__ == '__main__':
    # 本地调试用
    app.run(host='0.0.0.0', port=3001, debug=True)
