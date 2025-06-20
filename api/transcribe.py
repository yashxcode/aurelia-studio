from http.server import BaseHTTPRequestHandler
import json
import base64
import tempfile
import os
from faster_whisper import WhisperModel

def transcribe_audio(audio_data_base64):
    """Transcribe audio using faster-whisper"""
    try:
        # Decode base64 audio data
        audio_data = base64.b64decode(audio_data_base64)
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            temp_file.write(audio_data)
            temp_file_path = temp_file.name
        
        # Load Whisper model
        model = WhisperModel("small", device="cpu", compute_type="int8")
        
        # Transcribe
        segments, info = model.transcribe(temp_file_path, beam_size=5)
        
        # Combine segments into full transcript
        transcript = ""
        for segment in segments:
            transcript += segment.text.strip() + " "
        
        # Clean up temporary file
        os.unlink(temp_file_path)
        
        return transcript.strip()
        
    except Exception as e:
        raise Exception(f"Transcription failed: {str(e)}")

def parse_multipart_data(body, boundary):
    """Parse multipart form data"""
    try:
        # Find the file data in multipart form
        parts = body.split(boundary.encode())
        
        for part in parts:
            if b'Content-Disposition: form-data; name="file"' in part:
                # Extract file data
                file_start = part.find(b'\r\n\r\n') + 4
                file_end = part.rfind(b'\r\n')
                if file_end == -1:
                    file_end = len(part)
                
                file_data = part[file_start:file_end]
                return file_data
        
        return None
    except Exception as e:
        raise Exception(f"Failed to parse multipart data: {str(e)}")

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/transcribe':
            try:
                # Get content length and content type
                content_length = int(self.headers.get('Content-Length', 0))
                content_type = self.headers.get('Content-Type', '')
                
                # Read request body
                body = self.rfile.read(content_length)
                
                # Parse multipart boundary
                if 'boundary=' in content_type:
                    boundary = '--' + content_type.split('boundary=')[1]
                else:
                    raise Exception("No boundary found in Content-Type")
                
                # Parse file data
                file_data = parse_multipart_data(body, boundary)
                if not file_data:
                    raise Exception("No file found in request")
                
                # Convert to base64
                audio_base64 = base64.b64encode(file_data).decode('utf-8')
                
                # Transcribe
                transcript = transcribe_audio(audio_base64)
                
                # Return response
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                self.end_headers()
                
                response = json.dumps({'transcript': transcript})
                self.wfile.write(response.encode())
                
            except Exception as e:
                # Return error response
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                error_response = json.dumps({'error': str(e)})
                self.wfile.write(error_response.encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_OPTIONS(self):
        # Handle CORS preflight requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers() 