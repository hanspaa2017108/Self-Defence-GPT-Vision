from flask import Flask, request, jsonify, render_template
from openai import OpenAI
import os
import base64
import traceback
from dotenv import load_dotenv

load_dotenv()
openai_api_key = os.getenv('openai_api_key')

app = Flask(__name__)
client = OpenAI(api_key=openai_api_key)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze-image', methods=['POST'])
def analyze_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file:
        file_path = 'temp_image.jpg'
        file.save(file_path)
        
        try:
            with open(file_path, "rb") as image_file:
                base64_image = base64.b64encode(image_file.read()).decode()
                
                response = client.chat.completions.create(
                    model="gpt-4-vision-preview",
                    messages=[
                         {
                            "role": "system",
                            "content": "You are an AI trained to provide detailed analysis of images focusing on identifying potential objects that can be used for self-defense. Specifically, exclude random pictures, areas with minimal objects or empty areas/ places/ benches. For images predominantly featuring such content, respond with 'No object detected'. For other images, identify objects that could be used for self-defense."
                        },
                        {
                            
                            "role": "user",
                            "content": [
                                {"type": "text", 
                                 "text": "Please analyze this image and list all objects detected. For each object, indicate with '-Yes' if it could potentially be used for self-defense under any scenario, including worst-case scenarios, or '-No' if it cannot. Focus on identifying and evaluating each object's feasibility for self-defense."""},
                                { 
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{base64_image}"
                                    }
                                },
                            ],
                        }
                    ],
                    max_tokens=200,
                )
            
            analysis = response.choices[0].message.content
            os.remove(file_path)  # Clean up the temporary file
            return jsonify({'description': analysis})
        except Exception as e:
            if os.path.exists(file_path):
                os.remove(file_path)  # Ensure cleanup even if an error occurs
            error_message = str(e)
            stack_trace = traceback.format_exc()
            print(f"Error: {error_message}")
            print(f"Stack trace: {stack_trace}")
            return jsonify({'error': error_message, 'stack_trace': stack_trace}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)