import { User } from "../type/api";

export const UserList = ({
  users,
  fetchUsersError,
}: {
  users?: User[];
  fetchUsersError: string | null;
}) => {
  if (fetchUsersError) {
    return (
      <p style={{ color: "red" }}>Error fetching users: {fetchUsersError}</p>
    );
  }
  return (
    <div>
      <h2>All Users:</h2>
      {users ? (
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
      ) : (
        <p>No users fetched yet.</p>
      )}
    </div>
  );
};
