import { User } from "../type/api";

export const UsersTable = ({
  users,
  errorMessage,
  isFetching,
}: {
  users?: User[];
  isFetching: boolean;
  errorMessage: string | null;
}) => {
  if (errorMessage) {
    return <p style={{ color: "red" }}>Error fetching users: {errorMessage}</p>;
  }

  if (isFetching) {
    return <p>Fetching users...</p>;
  }

  if (users === undefined) {
    return <p>No users fetched yet.</p>;
  }

  if (!users || users.length === 0) {
    return <p>Empty Users.</p>;
  }

  return (
    <table border={1} style={{ borderCollapse: "collapse", width: "100%" }}>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Age</th>
          <th>Joined At</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td>{user.id}</td>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>{user.age}</td>
            <td>{user.joinedAt}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
