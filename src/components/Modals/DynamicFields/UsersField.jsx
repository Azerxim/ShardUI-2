import { useEffect, useState } from "react";
import { getUsers } from "../../../services/api";
import FieldWrapper from "./FieldWrapper";
import { selectValue } from "./selectValue";

// Liste déroulante des utilisateurs
export default function UsersField({ champ, value, onChange }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch((error) => console.error("Error fetching users:", error));
  }, []);

  return (
    <FieldWrapper champ={champ}>
      <select
        value={selectValue(value, users.map((user) => user.id))}
        className="select select-ghost bg-base-100 brightness-98 w-full"
        onChange={(e) => onChange(champ.name, e.target.value)}
        required={champ.required}
      >
        <option key="placeholder" value="" disabled={true}>
          {champ.placeholder}
        </option>
        {users.map((user) => (
          <option key={user.id} value={String(user.id)}>
            {user.full_name ? user.full_name : user.username}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}
