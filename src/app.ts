import express from "express";
import dotenv from "dotenv";
import config from "./config";
import cors from "cors";
import morgan from "morgan";
import formidable from "formidable";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: config.key.openai,
});

const app = express();

dotenv.config();

const corsOptions = {
  origin: config.host.cors,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined"));

app.post("/api/upload", async (req, res) => {
  const form = formidable({ multiples: true });
  try {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.status(500).json({ error: "Error parsing form data." });
        return;
      }

      const folder = "audio";
      if (!fs.existsSync(`${__dirname}/${folder}`)) {
        fs.mkdirSync(`${__dirname}/${folder}`);
      }

      // files.video는 업로드된 비디오 파일 정보
      const videoData = files.video[0];

      const mp3FilePath = `${__dirname}/${folder}/${videoData.originalFilename}.mp3`;

      let mp3File;
      // FFmpeg를 사용하여 비디오를 MP3로 변환
      const promise = () => {
        return new Promise((resolve, reject) => {
          ffmpeg()
            .input(videoData.filepath)
            .audioCodec("libmp3lame") // MP3 코덱 사용
            .toFormat("mp3") // MP3 형식으로 출력
            .on("end", async () => {
              // 변환된 MP3 파일을 클라이언트에게 제공
              mp3File = fs.createReadStream(mp3FilePath);
              let summary_text;
              if (mp3File) {
                try {
                  // whisper-1을 사용하여 오디오 파일을 텍스트로 변환
                  const transcript = await openai.audio.transcriptions.create({
                    file: mp3File,
                    model: "whisper-1",
                  });
                  if (transcript.text === "") {
                    resolve("");
                    return;
                  }
                  // gpt-3.5-turbo를 사용하여 텍스트를 요약
                  const completion = await openai.chat.completions.create({
                    model: "gpt-4",
                    messages: [
                      {
                        role: "user",
                        content:
                          transcript.text + "\n\n회의내용의 요점을 말해줘",
                      },
                    ],
                  });
                  summary_text = completion.choices[0].message.content;
                  // // 텍스트들을 파일로 저장
                  fs.writeFileSync(
                    `${__dirname}/${folder}/${videoData.originalFilename}.txt`,
                    transcript.text
                  );
                  if (summary_text) {
                    fs.writeFileSync(
                      `${__dirname}/${folder}/${videoData.originalFilename}_summary.txt`,
                      summary_text
                    );
                  }
                } catch (e) {
                  console.log("e", e);
                }
              }
              resolve(summary_text);
            })
            .on("error", (err) => {
              res.status(500).json({ error: "Error parsing form data" });
              reject(false);
            })
            .save(mp3FilePath);
        });
      };
      const result = await promise();
      if (result) {
        res
          .status(200)
          .json({ message: "Upload success.", summary_text: result });
      } else {
        res.status(200).json({ message: "No text", summary_text: "" });
      }
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "Error parsing form data." });
  }
});

app.listen(config.host, () => {
  console.log(`Server is running on ${config.host.port}`);
});
