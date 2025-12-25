import { useNavigate } from "react-router-dom";

export default function PrivacyPage() {
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
          개인정보처리방침
        </h1>
        <div className="size-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="prose dark:prose-invert prose-sm max-w-none text-text-sub-light dark:text-text-sub-dark">
          <h3>1. 개인정보의 처리 목적</h3>
          <p>
            Fridgy(이하 "회사")는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>회원 가입 의사 확인</li>
            <li>회원제 서비스 제공에 따른 본인 식별·인증</li>
            <li>회원자격 유지·관리</li>
            <li>서비스 부정이용 방지</li>
            <li>고지사항 전달</li>
          </ul>

          <h3>2. 개인정보의 처리 및 보유 기간</h3>
          <p>
            ① 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.<br />
            ② 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>회원 가입 및 관리 : 회원 탈퇴 시까지</li>
            <li>다만, 다음의 사유에 해당하는 경우에는 해당 사유 종료 시까지</li>
          </ul>
          <p className="mt-2">
            ③ 가족 그룹 기능을 이용하는 경우, 그룹 내 공유된 데이터(냉장고, 아이템 등)는 서비스 연속성을 위하여 그룹의 마지막 구성원이 탈퇴할 때까지 보관됩니다.
          </p>

          <h3>3. 처리하는 개인정보의 항목</h3>
          <p>
            회사는 회원가입, 고객상담, 서비스 신청 등을 위해 아래와 같은 개인정보를 수집하고 있습니다.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>수집항목 : 이메일, 비밀번호, 이름</li>
            <li>수집방법 : 홈페이지/앱 회원가입</li>
          </ul>

          <h3>4. 개인정보의 파기절차 및 파기방법</h3>
          <p>
            ① 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.<br />
            ② 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다.
          </p>

          <h3>5. 이용자 및 법정대리인의 권리와 그 행사방법</h3>
          <p>
            이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며 가입해지를 요청할 수 있습니다.
          </p>

          <h3>6. 개인정보 보호책임자</h3>
          <p>
            회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
          </p>
          <ul className="list-none pl-0 space-y-1 mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <li>연락처 : support@fridgy.app (예시)</li>
          </ul>

          <p className="mt-8 text-xs text-gray-400">
            * 본 개인정보처리방침은 예시이며, 실제 서비스 운영 시 법률 전문가의 검토를 거쳐 수정될 수 있습니다.
          </p>
        </div>
      </main>
    </div>
  );
}
