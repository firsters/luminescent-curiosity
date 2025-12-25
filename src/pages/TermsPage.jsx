import { useNavigate } from "react-router-dom";

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between bg-background-light/90 dark:bg-background-dark/90 px-4 py-3 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={() => navigate(-1)}
          className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 text-text-main-light dark:text-text-main-dark"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-text-main-light dark:text-text-main-dark">
          이용약관
        </h1>
        <div className="size-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="prose dark:prose-invert prose-sm max-w-none text-text-sub-light dark:text-text-sub-dark">
          <h3>제1조 (목적)</h3>
          <p>
            본 약관은 Fridgy(이하 "회사")가 제공하는 냉장고 관리 서비스(이하 "서비스")의 이용조건 및 절차, 회사와 회원의 권리, 의무 및 책임사항 등 기타 필요한 사항을 규정함을 목적으로 합니다.
          </p>

          <h3>제2조 (용어의 정의)</h3>
          <p>
            1. "서비스"라 함은 구현되는 단말기와 상관없이 "회원"이 이용할 수 있는 Fridgy 및 관련 제반 서비스를 의미합니다.<br />
            2. "회원"이라 함은 회사의 "서비스"에 접속하여 이 약관에 따라 "회사"와 이용계약을 체결하고 "회사"가 제공하는 "서비스"를 이용하는 고객을 말합니다.
          </p>

          <h3>제3조 (약관의 게시와 개정)</h3>
          <p>
            1. "회사"는 이 약관의 내용을 "회원"이 쉽게 알 수 있도록 서비스 초기 화면이나 설정 메뉴 등에 게시합니다.<br />
            2. "회사"는 필요한 경우 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.
          </p>

          <h3>제4조 (회원가입)</h3>
          <p>
            1. 이용자는 "회사"가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다.<br />
            2. "회사"는 전항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다.
          </p>

          <h3>제5조 (개인정보보호 의무)</h3>
          <p>
            "회사"는 "정보통신망법" 등 관계 법령이 정하는 바에 따라 "회원"의 개인정보를 보호하기 위해 노력합니다. 개인정보의 보호 및 사용에 대해서는 관련 법령 및 "회사"의 개인정보처리방침이 적용됩니다.
          </p>

          <h3>제6조 (회원의 아이디 및 비밀번호의 관리에 대한 의무)</h3>
          <p>
            1. "회원"의 아이디와 비밀번호에 관한 관리책임은 "회원"에게 있으며, 이를 제3자가 이용하도록 하여서는 안 됩니다.<br />
            2. "회원"은 아이디 및 비밀번호가 도용되거나 제3자가 사용하고 있음을 인지한 경우에는 이를 즉시 "회사"에 통지하고 "회사"의 안내에 따라야 합니다.
          </p>

          <p className="mt-8 text-xs text-gray-400">
            * 본 약관은 예시이며, 실제 서비스 운영 시 법률 전문가의 검토를 거쳐 수정될 수 있습니다.
          </p>
        </div>
      </main>
    </div>
  );
}
