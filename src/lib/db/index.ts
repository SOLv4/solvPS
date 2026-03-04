import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// 1. 데이터베이스 클라이언트 생성
// process.env.DATABASE_URL에 저장된 접속 정보를 사용하여 postgres 인스턴스를 만듭니다.
// prepare: false는 Supabase(또는 PgBouncer) 환경에서 연결 풀링 최적화를 위해 주로 설정합니다.
const client = postgres(process.env.DATABASE_URL!, { prepare: false });

// 2. Drizzle ORM 인스턴스 내보내기
// 생성한 클라이언트와 미리 정의한 schema를 합쳐서 'db' 객체를 만듭니다.
// 이제 'db.select().from(users)...' 처럼 타입 안정성이 보장된 쿼리를 날릴 수 있습니다.
export const db = drizzle(client, { schema });
