import { User } from "../type/api";

export const UserInfoTable = ({
  user,
  errorMessage,
  isFetching,
}: {
  user?: User;
  errorMessage: string | null;
  isFetching: boolean;
}) => {
  if (errorMessage) {
    return <p style={{ color: "red" }}>Error fetching users: {errorMessage}</p>;
  }

  if (isFetching) {
    return <p>Fetching users...</p>;
  }

  if (!user) {
    return <p>No users fetched yet.</p>;
  }
  return (
    <table border={1} style={{ borderCollapse: "collapse", width: "50%" }}>
      <thead>
        <tr>
          <th>Field</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>ID</td>
          <td>{user.id}</td>
        </tr>
        <tr>
          <td>Name</td>
          <td>{user.name}</td>
        </tr>
        <tr>
          <td>Email</td>
          <td>{user.email}</td>
        </tr>
        <tr>
          <td>Age</td>
          <td>{user.age}</td>
        </tr>
        <tr>
          <td>Joined At</td>
          <td>{user.joinedAt}</td>
        </tr>
        <tr>
          <td>Interests</td>
          <td>{user.interests.join(", ")}</td>
        </tr>
      </tbody>
    </table>
  );
};
