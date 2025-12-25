import { useNavigate } from "react-router-dom";

export default function LicensesPage() {
  const navigate = useNavigate();

  const licenses = [
    {
      name: "React",
      url: "https://react.dev",
      license: "MIT",
      copyright: "Copyright (c) Meta Platforms, Inc. and affiliates.",
    },
    {
      name: "Firebase",
      url: "https://firebase.google.com",
      license: "Apache-2.0",
      copyright: "Copyright Google LLC",
    },
    {
      name: "Tailwind CSS",
      url: "https://tailwindcss.com",
      license: "MIT",
      copyright: "Copyright (c) Tailwind Labs, Inc.",
    },
    {
      name: "React Router",
      url: "https://reactrouter.com",
      license: "MIT",
      copyright: "Copyright (c) Remix Software Inc.",
    },
    {
      name: "Vite",
      url: "https://vitejs.dev",
      license: "MIT",
      copyright: "Copyright (c) 2019-present Evan You & Vite Contributors",
    },
    {
      name: "React Icons",
      url: "https://react-icons.github.io/react-icons",
      license: "MIT",
      copyright: "Copyright (c) 2015-present Kamran Ahmed",
    },
  ];

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
          오픈소스 라이선스
        </h1>
        <div className="size-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6">
        <p className="mb-6 text-sm text-text-sub-light dark:text-text-sub-dark px-2">
          본 서비스는 다음의 오픈소스 소프트웨어를 활용하여 개발되었습니다. 각 소프트웨어의 라이선스 고지는 아래와 같습니다.
        </p>

        <div className="flex flex-col gap-4">
          {licenses.map((lib, index) => (
            <div
              key={index}
              className="rounded-xl bg-surface-light dark:bg-surface-dark p-4 shadow-sm border border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-text-main-light dark:text-text-main-dark">
                  {lib.name}
                </h3>
                <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-500">
                  {lib.license}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {lib.copyright}
              </p>
              <a
                href={lib.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                홈페이지 방문
                <span className="material-symbols-outlined text-[12px]">
                  open_in_new
                </span>
              </a>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
