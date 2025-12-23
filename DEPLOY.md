# 배포 및 설치 가이드 (DEPLOY.md)

이 문서는 개발된 Fridgy 앱을 인터넷에 배포하고, 스마트폰에 설치하는 방법을 설명합니다.

## 1. 사전 준비

*   [GitHub 계정](https://github.com/): 소스 코드가 저장된 곳입니다.
*   [Vercel 계정](https://vercel.com/): 앱을 무료로 배포할 수 있는 서비스입니다. GitHub 계정으로 가입하세요.

## 2. Vercel에 배포하기

이 프로젝트는 `vercel.json` 설정이 되어 있어 Vercel에서 쉽게 배포할 수 있습니다.

1.  **Vercel 대시보드 접속:** [Vercel Dashboard](https://vercel.com/dashboard)로 이동합니다.
2.  **새 프로젝트 추가:** `Add New...` > `Project`를 클릭합니다.
3.  **GitHub 리포지토리 연결:** `Import Git Repository`에서 현재 작업 중인 리포지토리(Fridgy)를 찾아 `Import` 버튼을 클릭합니다.
4.  **프로젝트 설정:**
    *   **Framework Preset:** `Vite`가 자동으로 감지되어야 합니다. (아니라면 `Vite` 선택)
    *   **Root Directory:** `./` (기본값)
5.  **환경 변수 설정 (중요):**
    *   `Environment Variables` 섹션을 펼칩니다.
    *   로컬 개발 환경의 `.env` 파일에 있는 내용을 하나씩 복사하여 추가해야 합니다.
    *   **필수 변수 목록:**
        *   `VITE_FIREBASE_API_KEY`
        *   `VITE_FIREBASE_AUTH_DOMAIN`
        *   `VITE_FIREBASE_PROJECT_ID`
        *   `VITE_FIREBASE_STORAGE_BUCKET`
        *   `VITE_FIREBASE_MESSAGING_SENDER_ID`
        *   `VITE_FIREBASE_APP_ID`
    *   *주의: 값에는 따옴표("")를 포함하지 마세요.*
6.  **배포 시작:** `Deploy` 버튼을 클릭합니다.
7.  **완료:** 배포가 완료되면 `https://your-project-name.vercel.app` 형태의 도메인이 생성됩니다.

## 3. 스마트폰에 앱 설치하기

배포된 URL(예: `https://fridgy.vercel.app`)을 가족이나 친구에게 공유하세요.

### 안드로이드 (Chrome 브라우저 기준)
1.  공유받은 URL로 접속합니다.
2.  앱의 **설정 페이지**로 이동합니다.
3.  **'앱 정보'** 섹션에 있는 **'앱 설치하기'** 버튼을 누릅니다.
    *   또는 브라우저 메뉴(점 3개) > **'앱 설치'** 또는 **'홈 화면에 추가'**를 선택합니다.
4.  설치가 완료되면 홈 화면에 아이콘이 생성되고, 일반 앱처럼 사용할 수 있습니다.

### iOS (Safari 브라우저 기준)
*iOS는 '앱 설치하기' 버튼이 동작하지 않을 수 있으므로, 브라우저 메뉴를 이용해야 합니다.*

1.  Safari 브라우저에서 URL로 접속합니다.
2.  하단의 **공유 버튼**(네모에서 화살표가 위로 나가는 아이콘)을 누릅니다.
3.  메뉴를 아래로 내려 **'홈 화면에 추가' (Add to Home Screen)**를 선택합니다.
4.  우측 상단의 **'추가'** 버튼을 누릅니다.
5.  홈 화면에 아이콘이 생성됩니다.

## 4. 업데이트 방법

앱이 업데이트되면 사용자에게 '새로운 버전 업데이트' 버튼이 표시되거나, 앱을 다시 열 때 자동으로 업데이트를 확인합니다.
