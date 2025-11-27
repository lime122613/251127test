# 251127test

Netlify 배포 관련 안내

- 권장 Netlify 설정:
	- Base directory: (비워두기) 또는 프로젝트 루트
	- Build command: `npm run build`
	- Publish directory: `vite-project/dist`

- 또는 Netlify의 Site settings > Build & deploy > Environment 에 `VITE_OPENAI_API_KEY` 를 추가하세요.

루트에 추가한 `package.json`은 `npm run build` 명령으로 서브폴더 `vite-project`를 빌드하도록 도와줍니다.