import { useState } from "react";
import "./App.css";
import { MSWDevTool } from "msw-dev-tool";
import { useMsw } from "./hooks/useMsw";
import { User } from "./type/api";
import { useFetch } from "./hooks/useFetch";
import { UserList } from "./components/UserList";
import { UserInfo } from "./components/UserInfo";

function App() {
  useMsw();
  const [userId, setUserId] = useState<string>("");
  const {
    data: user,
    error: fetchUserError,
    fetchData: fetchUser,
  } = useFetch<User>(`/api/users/${userId}`);
  const {
    data: users,
    error: fetchUsersError,
    fetchData: fetchUsers,
  } = useFetch<User[]>(`/api/users`);

  return (
    <>
      <MSWDevTool />
      <div style={{ padding: "20px", fontFamily: "Arial" }}>
        <h1>User Management</h1>
        <div style={{ marginBottom: "20px" }}>
          <button
            onClick={fetchUsers}
            style={{ padding: "10px 20px", cursor: "pointer" }}
          >
            Fetch All Users
          </button>
        </div>
        <div style={{ marginBottom: "20px" }}>
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
          >
            Fetch User by ID
          </button>
        </div>
        <UserList users={users} fetchUsersError={fetchUsersError} />
        <UserInfo user={user} fetchUserError={fetchUserError} />
      </div>
    </>
  );
}

export default App;
