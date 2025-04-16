import "./App.css";
import { MSWDevTool } from "@msw-dev-tool/react";
import "@msw-dev-tool/react/msw-dev-tool.css";
import { useMsw } from "./hooks/useMsw";
import { UserList } from "./components/UserList";
import { UserInfo } from "./components/UserInfo";
import { OtherHostUserList } from "./components/OtherHostUserList";

function App() {
  useMsw();

  return (
    <>
      <MSWDevTool />
      <div style={{ fontFamily: "Arial" }}>
        <h1>User Management</h1>
        <UserList />
        <UserInfo />
        <OtherHostUserList />
      </div>
    </>
  );
}

export default App;
