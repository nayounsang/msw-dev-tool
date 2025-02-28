import { useFetch } from "../hooks/useFetch";
import { User } from "../type/api";
import { UsersTable } from "./UsersTable";

export const OtherHostUserList = () => {
  const {
    data: users,
    error,
    fetchData: fetchUsers,
    isFetching,
  } = useFetch<User[]>(`https://example.com/users`);

  return (
    <section
      style={{
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "1rem",
      }}
    >
      <h2>Other Host User List</h2>
      <button
        onClick={fetchUsers}
        style={{ padding: "10px 20px", cursor: "pointer" }}
      >
        Fetch
      </button>
      <div style={{ height: "180px", overflow: "scroll" }}>
        <UsersTable users={users} isFetching={isFetching} errorMessage={error} />
      </div>
    </section>
  );
};
