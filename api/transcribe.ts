import { NextApiRequest, NextApiResponse } from "next"
import formidable from "formidable"
import fs from "fs"
import path from "path"
import { pipeline } from "stream"

// Use 'faster-whisper' via Python child process for best speed/accuracy on Vercel
import { spawn } from "child_process"

export const config = {
  api: {
    bodyParser: false,
  },
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const form = new formidable.IncomingForm()
  form.uploadDir = "/tmp"
  form.keepExtensions = true

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: "File upload error" })
    }
    const file = files.file
    if (!file || Array.isArray(file)) {
      return res.status(400).json({ error: "No file uploaded" })
    }
    const filePath = file.filepath || file.path
    try {
      // Call Python script with faster-whisper
      const python = spawn("python3", [
        path.join(process.cwd(), "api", "whisper_transcribe.py"),
        filePath,
      ])
      let transcript = ""
      let error = ""
      python.stdout.on("data", (data) => {
        transcript += data.toString()
      })
      python.stderr.on("data", (data) => {
        error += data.toString()
      })
      python.on("close", (code) => {
        if (code === 0) {
          res.status(200).json({ transcript })
        } else {
          res.status(500).json({ error: error || "Transcription failed" })
        }
      })
    } catch (e) {
      res.status(500).json({ error: "Transcription error" })
    }
  })
}

export default handler
