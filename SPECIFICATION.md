# 기능 사양서 (Functional Specification)

## 1. 프로젝트 개요
**프로젝트명:** 나의 냉장고 (My Fridge)
**목적:** 가정 내 냉장고 및 식자재의 효율적인 관리를 돕는 PWA(Progressive Web App) 기반의 재고 관리 서비스입니다.
**주요 특징:** 직관적인 UI, 바코드 스캔을 통한 간편 등록, 유통기한 임박 알림, 가족 구성원 간의 데이터 공유(Firebase 기반).

---

## 2. 기술 스택
- **Frontend:** React (Vite), Tailwind CSS
- **Backend / Database:** Google Firebase (Authentication, Firestore)
- **Deployment:** Vercel (SPA Routing 지원)
- **PWA:** vite-plugin-pwa (설치형 앱 지원, 오프라인 지원, 자동 업데이트)

---

## 3. 화면 구성 및 주요 기능

### 3.1 로그인 및 인증 (Login)
- **구글 로그인:** Firebase Auth를 이용한 간편 로그인 지원.
- **가족 그룹 매핑:** 로그인 시 사용자의 `familyId`를 확인하여 동일한 가족 그룹 내의 데이터를 공유.
- **자동 로그인:** PWA 특성을 살려 지속적인 세션 유지.

### 3.2 홈 / 냉장고 목록 (Fridge List)
**경로:** `/`

#### 3.2.1 레이아웃 구조 (Layout Structure)
- **Header (상단바):**
  - **좌측:** 메뉴 아이콘 (현재 기능 없음, UI 장식용).
  - **중앙:** 타이틀 "나의 냉장고".
  - **우측:** 알림 아이콘, 로그아웃 버튼.
  - **스타일:** `sticky top-0`, 배경 블러 처리(`backdrop-blur-md`), 높이 약 64px.

- **Stats Dashboard (통계 대시보드):**
  - **위치:** 헤더 바로 아래.
  - **구성:** 가로 스크롤 가능한 카드형 UI.
  - **카드 1 (전체 보관):**
    - 배경: Primary Color (Green) 틴트 (`bg-primary/10`).
    - 데이터: `status === 'available'`인 모든 아이템 수.
    - 클릭 동작: `/inventory` (전체 목록) 이동.
  - **카드 2 (유통기한 임박):**
    - 배경: Red Color 틴트 (`bg-red-50`).
    - 데이터: 유통기한 3일 이내 아이템 수.
    - 클릭 동작: `/inventory?filter=expiring` 이동.

- **Fridge Grid (냉장고 목록 그리드):**
  - **타이틀 영역:** "보관 장소 목록" 텍스트와 우측 "편집/완료" 토글 버튼.
  - **그리드 레이아웃:** 반응형 그리드 (`grid-cols-2` ~ `grid-cols-5`).
  - **냉장고 카드 (Fridge Card):**
    - **비율:** 4:3 (이미지 영역) + 하단 텍스트 영역.
    - **이미지:** Unsplash 랜덤 이미지 (키워드: food/kitchen) + 어두운 오버레이.
    - **아이콘 배지:** 우측 하단에 냉장고 종류별 아이콘(kitchen, ac_unit 등) 표시.
    - **텍스트:** 냉장고 이름 (Bold), 아이템 개수 (Small text).
    - **인터랙션:**
      - **일반 모드:** 클릭 시 해당 냉장고 상세 페이지(`/inventory?fridgeId=...`)로 이동.
      - **편집 모드:** 클릭 시 '수정 팝업' 오픈. 카드 위에 '수정(연필)' 오버레이 표시.
  - **추가 버튼 (Add Button):**
    - 점선 테두리(`border-dashed`) 스타일의 카드.
    - 중앙에 `+` 아이콘 및 "새 냉장고 추가" 텍스트.

#### 3.2.2 주요 기능 및 인터랙션 (Key Interactions)
- **편집 모드 (Edit Mode):**
  - "편집" 버튼 클릭 시 활성화.
  - **UI 변화:** "편집" 버튼 텍스트가 "완료"로 변경됨. 냉장고 카드 클릭 동작이 '상세 이동'에서 '수정 모달 오픈'으로 변경됨.
  - **수정 모달 (Edit Modal):**
    - **입력 필드:** 냉장고 이름 (Input), 종류 선택 (Button Group).
    - **Action:** 저장(Primary), 취소(Secondary), **삭제(Danger)**.
    - **삭제 로직:** 삭제 버튼 클릭 -> `confirm` 경고창 -> 확인 시 냉장고 및 소속 아이템 일괄 삭제.

#### 3.2.3 스타일링 상세 (Styling Details)
- **Color Palette:**
  - **Primary:** Green (`#19e65e` 계열).
  - **Danger:** Red (`#ef4444` 계열).
  - **Background:** Light (`#ffffff`, `#f9fafb`) / Dark (`#000000`, `#111827`).
- **Typography:**
  - **Title:** `text-lg font-bold`.
  - **Card Title:** `text-base font-bold`.
  - **Count/Subtext:** `text-xs text-gray-500`.
- **Components:**
  - **Buttons:** Rounded-full (Icon buttons) or Rounded-xl (Action buttons).
  - **Cards:** `rounded-2xl`, `shadow-sm`, `active:scale-95` (터치 피드백).

### 3.3 음식 목록 및 상세 (Inventory List)
**경로:** `/inventory`
- **필터 및 검색:**
  - **검색창:** 음식 이름 실시간 검색.
  - **필터 칩:** 전체 / 유통기한 임박 / 냉장 / 냉동 등 상태별 필터링.
  - **상단 통계:** 현재 보고 있는 필터 기준(특정 냉장고 등)의 아이템 수 및 임박 수량 표시.
- **아이템 리스트:**
  - 아이템 카드: 사진, 이름, 카테고리, 수량, D-Day 배지 표시.
  - **소비 버튼:** 리스트 상에서 즉시 '소비 완료' 처리 가능.
  - **위치 표시:** '전체 보기' 모드일 경우, 각 아이템이 어느 냉장고에 있는지 배지로 표시.
- **아이템 상세/수정 (Modal):**
  - 아이템 클릭 시 상세 정보 모달 팝업.
  - **기능:** 정보 수정(이름, 수량, 유통기한 등), 삭제, 소비 완료 처리.
- **냉장고 관리 (Context Menu):**
  - 특정 냉장고 보기 상태에서 우측 상단 `...` 버튼 활성화.
  - 해당 냉장고의 **정보 수정** 및 **삭제** 기능 제공 (홈 화면 편집 모드와 동일한 UX).

### 3.4 아이템 등록 (Add Item)
**경로:** `/add`
- **입력 방식:**
  - **직접 입력:** 이름, 카테고리, 수량, 유통기한, 보관 장소(냉장고) 선택.
  - **바코드 스캔:** `react-zxing`을 이용해 상품 바코드를 스캔하여 정보 자동 입력(DB 연동 시).
  - **이미지 업로드:** 아이템 사진 촬영 또는 업로드.
- **수정 모드:** 기존 아이템 데이터를 불러와 수정 가능.

### 3.5 검색 (Search)
**경로:** `/search`
- 전체 인벤토리 대상 키워드 검색 기능 제공.

### 3.6 소비 기록 (History)
**경로:** `/history`
- **소비 완료**된 아이템들의 목록 및 날짜별 이력 조회.
- 홈 화면 대시보드에서 '이번 달 소비' 통계로 접근 가능.

### 3.7 설정 (Settings)
**경로:** `/settings`
- **앱 설치:** PWA 설치 프롬프트 트리거 (지원 브라우저).
- **데이터 관리:**
  - **전체 삭제 기능:** 보관 중 / 유통기한 만료 / 소비된 항목을 구분하여 일괄 삭제 지원.
- **앱 정보:** 현재 버전 및 빌드 날짜 표시 (`__APP_VERSION__` injection).
- **업데이트 확인:** 최신 버전 확인 및 새로고침.

---

## 4. 데이터 모델 (Firestore)

### 4.1 `fridges` Collection
| Field | Type | Description |
|---|---|---|
| `id` | String | Document ID (Auto-generated) |
| `name` | String | 냉장고 이름 (예: 집 냉장고) |
| `type` | String | 종류 (`fridge`, `freezer`, `kimchi`, `pantry`) |
| `familyId` | String | 가족 그룹 식별자 |
| `createdAt` | Timestamp | 생성 일시 |
| `createdBy` | String | 생성자 UID |

### 4.2 `inventory` Collection
| Field | Type | Description |
|---|---|---|
| `id` | String | Document ID |
| `name` | String | 아이템 이름 |
| `category` | String | 카테고리 (과일, 채소, 육류 등) |
| `quantity` | Number | 수량 |
| `unit` | String | 단위 (개, kg 등) |
| `expiryDate` | String (ISO) | 유통기한 |
| `fridgeId` | String | 소속된 냉장고 ID (`fridges` 컬렉션 참조) |
| `photoUrl` | String | 이미지 URL |
| `status` | String | 상태 (`available`, `consumed`, `discarded`) |
| `addedDate` | String (ISO) | 등록일 |
| `familyId` | String | 가족 그룹 식별자 |

---

## 5. UX/UI 가이드라인
- **모바일 최적화:** 모든 버튼은 터치하기 쉽도록 충분한 크기(Min 44px/size-10)를 유지합니다.
- **Hover 배제:** 모바일 환경을 고려하여 마우스 오버(Hover)에 의존하는 기능(예: 삭제 버튼 숨김)을 지양하고, 명시적인 모드 전환(편집 모드)이나 메뉴 버튼을 사용합니다.
- **안전한 삭제:** 데이터 영구 삭제 시 반드시 `confirm` 또는 모달을 통해 사용자 확인을 받습니다.
