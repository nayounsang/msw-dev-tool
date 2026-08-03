import { headers } from "next/headers";
import { UserInfoTable } from "@/components/UserInfoTable";
import { UsersTable } from "@/components/UsersTable";
import { ensureMswServer } from "@/mocks/node";
import { User } from "@/type/api";

const OTHER_HOST_USERS_URL = "https://example.com/users";
const sectionStyle = {
  padding: "1rem",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "flex-start",
  gap: "1rem",
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type FetchResult<T> = {
  data: T | undefined;
  error: string | null;
};

const fetchJson = async <T,>(url: string): Promise<FetchResult<T>> => {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return { data: undefined, error: `HTTP ${response.status} from ${url}` };
    }
    return { data: (await response.json()) as T, error: null };
  } catch (error) {
    return {
      data: undefined,
      error: error instanceof Error ? error.message : "Unknown fetch error",
    };
  }
};

const getRequestOrigin = async (): Promise<string> => {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!host) throw new Error("Unable to determine the request host for SSR fetch");

  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
};

const SsrUsersSection = ({
  title,
  result,
}: {
  title: string;
  result: FetchResult<User[]>;
}) => (
  <section style={sectionStyle}>
    <h2>{title}</h2>
    <div style={{ height: "220px", overflow: "auto" }}>
      <UsersTable
        users={result.data}
        isFetching={false}
        errorMessage={result.error}
      />
    </div>
  </section>
);

export default async function SsrSlotPage({
  searchParams,
}: {
  searchParams: Promise<{ ssrUserId?: string }>;
}) {
  await ensureMswServer();
  const origin = await getRequestOrigin();
  const { ssrUserId } = await searchParams;
  const selectedUserId = Number(ssrUserId);
  const hasSelectedUser = Number.isInteger(selectedUserId) && selectedUserId > 0;

  const [sameHostUsers, otherHostUsers, selectedUser] = await Promise.all([
    fetchJson<User[]>(`${origin}/api/users`),
    fetchJson<User[]>(OTHER_HOST_USERS_URL),
    hasSelectedUser
      ? fetchJson<User>(`${origin}/api/users/${selectedUserId}`)
      : Promise.resolve<FetchResult<User>>({ data: undefined, error: null }),
  ]);

  return (
    <div>
      <h2>Server mocking</h2>
      <SsrUsersSection title="User List" result={sameHostUsers} />

      <section style={sectionStyle}>
        <h2>Selected User</h2>
        <form>
          <input
            name="ssrUserId"
            type="number"
            min="1"
            defaultValue={hasSelectedUser ? selectedUserId : undefined}
            placeholder="Enter User ID"
            style={{ padding: "10px", marginRight: "10px" }}
          />
          <button type="submit" style={{ padding: "10px 20px", cursor: "pointer" }}>
            Fetch User by ID
          </button>
        </form>
        <div style={{ height: "180px", overflow: "auto", marginTop: "1rem" }}>
          <UserInfoTable
            user={selectedUser.data}
            isFetching={false}
            errorMessage={selectedUser.error}
          />
        </div>
      </section>
      <SsrUsersSection title="Other Host User List" result={otherHostUsers} />
    </div>
  );
}
