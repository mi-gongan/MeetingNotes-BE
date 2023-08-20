# MeetingNotes

: whisper와 chatgpt-4 api를 활용하여 회의 내용을 중간중간 팔로업할 수 있도록 기능을 제공하는 서비스입니다.

## Getting started

### 패키지 설치

```
npm install
```

### env 세팅

```
OPENAI_API_KEY=""
CORS_ORIGIN=""
HOST_PORT=""
```

### 서버 시작

```
npm run build
npm run start
```

## 기능

- 프론트로부터 받은 오디오파일을 ffmpeg를 사용하여 mp3파일로 변환
- mp3파일을 whisper api를 사용하여 텍스트로 변환
- chatgpt-4 api를 사용하여 텍스트를 요약
- 요약한 데이터를 response에 담아서 프론트로 전송
