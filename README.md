# 해외사업본부 교육계획 안내

해외사업본부 임직원을 위한 교육 방향, 운영계획, 교육 프로그램과 담당자 정보를 제공하는 정적 웹페이지입니다.

## 파일 구조

```text
.
├── index.html
├── style.css
├── script.js
├── data/
│   └── content.json
└── assets/
    └── hanwha-mark.svg
```

## 일반적인 정보 수정

교육 프로그램, 공지, FAQ, 담당자 등 자주 바뀌는 정보는 `data/content.json`에서 수정합니다.

- `notices`: 상단 공지
- `operation`: 교육 운영계획
- `programs`: 교육 프로그램과 연결 링크
- `process`: 참여 절차
- `resources`: 교육자료 및 외부 사이트
- `faqs`: 자주 묻는 질문
- `contacts`: 담당자

JSON은 마지막 항목 뒤에 쉼표를 넣지 않아야 합니다. 수정 후에는 JSON 문법 검사를 권장합니다.

```bash
python -m json.tool data/content.json
```

## 디자인·기능 수정

- 화면 구조: `index.html`
- 디자인과 모바일 화면: `style.css`
- 검색, 필터, FAQ, 메뉴: `script.js`
- 로고·자료 파일: `assets/`

## 로컬 확인

`content.json`을 불러오기 때문에 `index.html`을 파일로 직접 열지 말고 간단한 로컬 서버를 사용합니다.

```bash
python -m http.server 8000
```

브라우저에서 `http://localhost:8000`을 엽니다.

## GitHub Pages

저장소의 `Settings → Pages`에서 `Deploy from a branch`, `main`, `/ (root)`를 선택합니다.

예상 주소:

`https://jeonys-12.github.io/overseas-educational-information/`

## 운영 시 유의사항

- 이 페이지는 사내 구성원 안내용이지만, 공개 GitHub Pages에는 로그인이나 접근통제 기능이 없습니다.
- 게시 전 연락처, 내부 링크와 첨부자료의 공개 가능 여부를 확인하세요.
- 화면의 기준과 최신 사내 규정이 다를 경우 최신 사내 규정을 우선합니다.
