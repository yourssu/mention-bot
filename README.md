# 멘션봇

슬랙 무료버전의 한계를 뚫고 그룹별 멘션 자동화를 위해 태어난 봇이에요.

https://github.com/user-attachments/assets/2820c5ca-eb08-46e6-9ce7-3ebf77079def

자세한 스펙 및 맥락은 [유어슈 멘션봇 문서](https://www.notion.so/yourssu/1a96915d697880aeaca3f0ca49c7177b?pvs=4)를 통해 확인해주세요.

<br />

## 사용법

1. 원하는 메시지를 입력하세요.
2. 멘션봇이 인식할 수 있는 `멘션 그룹 키워드` 를 함께 메시지에 작성하세요.
3. 끝!

### 멘션 그룹 키워드

`/list` 봇 명령어를 통해 가능한 키워드 목록을 전부 확인할 수 있어요.

<br />

## 프로젝트 실행

### 1. Clone Project

```bash
git clone https://github.com/yourssu/mention-bot.git
```

<br />

### 2. env

env를 통한 슬랙 및 Notion API 접근 토큰이 필요해요.

현재는 [유어슈 멘션봇 .env 문서](https://www.notion.so/yourssu/env-1ad6915d6978800697d1cac1f528f668?pvs=4)에서 env를 관리하고 있어요.

조만간 Vault로 이관할 예정이에요.

.env 파일을 프로젝트 루트에 생성하고, 토큰을 넣어주세요.

<br />

### 3. Run Project

> vscode task가 설정되어 있어요.  
> vscode로 프로젝트를 열면 봇을 바로 로컬에서 실행할 수 있어요.

아래는 정석적으로 프로젝트를 실행하는 방법을 소개해요.

```bash
pnpm install
pnpm dev
```
