import { useState } from "react";
import { User } from "../type/api";
import { UserInfoTable } from "./UserInfoTable";
import { useFetch } from "../hooks/useFetch";

export const UserInfo = () => {
  const [userId, setUserId] = useState<string>("");
  const {
    data: user,
    error: error,
    fetchData: fetchUser,
    isFetching: isFetching,
  } = useFetch<User>(`/api/users/${userId}`);
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
      <h2>Selected User</h2>
      <input
        type="text"
        placeholder="Enter User ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        style={{ padding: "10px", marginRight: "10px" }}
      />
      <button
        onClick={fetchUser}
        style={{ padding: "10px 20px", cursor: "pointer" }}
        disabled={!userId}
      >
        Fetch User by ID
      </button>
      <div style={{ height: "180px", overflow: "scroll" }}>
        <UserInfoTable
          user={user}
          errorMessage={error}
          isFetching={isFetching}
        />
      </div>
    </section>
  );
};
