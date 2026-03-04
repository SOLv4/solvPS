// DEV STUB - better-auth 세팅 시 교체
export const auth = {
  api: {
    async getSession({ headers }: { headers: Headers }) {
      // TODO: replace with actual better-auth implementation
      // 개발 테스트용 mock - 실제 연동 시 제거
      return { user: { id: "1" } }; // 테스트용 - 실제 연동 시 제거
    },
  },
};
