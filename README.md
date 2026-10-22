# HRA 2026 Year-End Party

HRA 2026 송년회의 기본 웹사이트와 인터랙티브 디지털 초대장입니다. 마법학교와 마법 세계에서 영감을 얻은 밤하늘, 독창적인 성 SVG, 황금 장식, 밀랍 봉인과 양피지 편지로 초대받는 경험을 표현합니다. 공식 Harry Potter 로고, 영화 이미지, 음악은 사용하지 않습니다.

웹사이트: **https://yeongseon.dev/hra-2026-year-end-party/**

GitHub Pages 기본 주소: https://yeongseon.github.io/hra-2026-year-end-party/ — 계정에 설정된 사용자 지정 도메인을 따라 위 주소로 연결됩니다.

저장소: https://github.com/yeongseon/hra-2026-year-end-party

## 현재 제공하는 기능

- 봉인된 편지봉투를 누르면 열리는 디지털 초대장
- 초대장 닫기, Escape 키, 키보드 이동과 초점 복귀
- 기기의 기본 공유 기능, URL 복사 및 복사 권한이 없을 때 직접 복사 안내
- 모바일·태블릿·데스크톱 레이아웃, 동작 줄이기 설정 지원
- 날짜·장소·드레스코드는 **추후 안내**, 프로그램은 **추후 공개**

참가 신청, 참석 여부 저장, 게임, 투표, 점수 집계와 세부 행사 시간표는 구현하지 않았습니다. 서버와 데이터베이스, 실행 시 필요한 외부 패키지는 없습니다.

## 로컬 실행

Python 3가 있으면 설치 과정 없이 웹사이트를 열 수 있습니다.

```sh
git clone https://github.com/yeongseon/hra-2026-year-end-party.git
cd hra-2026-year-end-party
make serve
```

브라우저에서 http://127.0.0.1:8000 에 접속합니다. `make`가 없으면 `python3 -m http.server 8000 --bind 127.0.0.1`을 실행합니다. 공유·클립보드 API는 브라우저와 권한에 따라 제공 여부가 다르며, HTTPS 또는 localhost에서 확인하세요.

## 프로젝트 구조

```text
.
├── index.html                 # 메인 화면과 초대장 문구
├── styles.css                 # 반응형 디자인과 봉투 애니메이션
├── script.js                  # 행사 정보와 열기·닫기·공유
├── assets/
│   ├── castle.svg             # 독창적인 마법학교 성
│   └── favicon.svg
├── tests/
│   ├── static.test.js         # 파일·콘텐츠·범위 검사
│   ├── css-check.js           # CSS 구문·선언 검사
│   └── invitation.spec.js     # 실제 브라우저 기능·반응형 검사
├── .github/workflows/
│   ├── ci.yml                 # 정적 검사와 브라우저 테스트
│   └── pages.yml              # 검증 후 GitHub Pages 배포
├── playwright.config.js
├── package.json
├── package-lock.json
├── .htmlvalidate.json
├── .gitignore
├── .nojekyll
├── Makefile
└── README.md
```

## 행사 정보 수정

`script.js` 맨 위의 `EVENT` 객체에서 `title`, `date`, `location`, `dressCode` 값을 수정합니다. `data-event` 속성이 있는 화면에 같은 값이 반영됩니다. JavaScript가 실행되지 않을 때도 읽히는 기본 문구를 유지하기 위해 `index.html`의 대응 문구도 함께 수정하세요.

행사명 변경 시 HTML의 `<title>`·메타 설명·주요 제목과 테스트도 함께 확인합니다. 초대 메시지는 `index.html`, 색상과 간격은 `styles.css`에서 수정합니다. 확정 전 정보는 임의로 채우지 않습니다.

## 테스트

테스트 도구에는 Node.js 22 이상과 npm이 필요합니다. CI에서는 Node.js 24를 사용합니다.

```sh
npm ci
npx playwright install chromium
npm test
```

Linux에서 브라우저 시스템 라이브러리가 없다면 `npx playwright install --with-deps chromium`을 사용합니다.

- `npm run lint`: HTML 유효성, CSS 구문과 선언 값, JavaScript 구문 검사
- `npm run test:static`: 필수 파일, 행사명, 미정 정보, 프로젝트 경로 호환성, 범위 제한 검사
- `npm run test:browser`: Chromium에서 초대장·키보드·공유·복사·오류 처리·동작 줄이기 검사
- `make check`, `make test`: 위 검사 명령의 단축 명령

반응형 테스트는 360px, 390px, 768px, 1440px 너비에서 화면 넘침과 초대장 조작을 확인하고 스크린샷을 `test-results/`에 저장합니다. 실패 시 보고서는 `playwright-report/`에서 확인합니다. 결과 파일은 Git에 포함하지 않습니다. 기기 공유창은 브라우저 자동화에서 모의 API로 검사하므로 실제 모바일의 기본 공유창은 기기에서 추가 확인할 수 있습니다.

배포 사이트에도 같은 브라우저 테스트를 실행할 수 있습니다.

```sh
BASE_URL=https://yeongseon.dev/hra-2026-year-end-party/ npm run test:browser
```

## GitHub Pages 배포

저장소 Settings → Pages → Build and deployment에서 Source를 **GitHub Actions**로 설정합니다. `main`에 push하면 CI가 정적 검사와 브라우저 테스트를 실행합니다. Pages 워크플로도 같은 CI를 선행 실행하며, 통과한 경우에만 공개 파일을 아티팩트로 올리고 `github-pages` 환경에 배포합니다. 별도 빌드는 필요 없습니다.

배포 대상은 `index.html`, `styles.css`, `script.js`, `.nojekyll`, `assets/`뿐입니다. 테스트 코드와 개발 의존성은 웹사이트에 배포하지 않습니다. Actions에서 `Deploy GitHub Pages` 실행 결과와 실제 사이트를 확인하세요. `workflow_dispatch`로 수동 재배포할 수도 있습니다.

## HRA 20기 학생 과제와 향후 확장

이 웹사이트는 HRA 20기 학생들에게 제공하는 바이브코딩 활용 예시입니다. 운영진은 기본 사이트와 초대장만 제작하고, 학생 3개 조는 송년회에 필요한 세부 프로그램을 자유롭게 기획합니다. 각 조가 아이디어를 발표한 뒤 우수한 요소를 조합하여 최종 행사 프로그램을 결정합니다.

세부 프로그램은 확정 이후 **별도 작업**으로 구현합니다. 현재는 사용하지 않는 빈 화면이나 동작하지 않는 메뉴를 노출하지 않습니다. 확정된 콘텐츠는 `index.html`의 의미 있는 섹션으로 추가하고, 행사 데이터는 `EVENT`, 화면 스타일은 `styles.css`, 기능은 `script.js`의 작은 함수로 나누어 확장할 수 있습니다. 새로운 기능에 필요한 데이터 보관과 운영 방식은 그때 별도로 결정합니다.
