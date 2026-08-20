"use client";

import { UserList } from "./UserList";
import { UserInfo } from "./UserInfo";
import { OtherHostUserList } from "./OtherHostUserList";
import { BrowserWebSocketProbe } from "./BrowserWebSocketProbe";

export const ClientMockingSection = () => {
  return (
    <div>
      <h2>Client mocking</h2>
      <UserList />
      <UserInfo />
      <OtherHostUserList />
      <BrowserWebSocketProbe />
    </div>
  );
};
