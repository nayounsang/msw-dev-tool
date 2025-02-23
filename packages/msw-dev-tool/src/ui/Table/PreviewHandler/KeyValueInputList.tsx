import React, { useState } from "react";

interface KeyValueInputListProps {
  items: Record<string, string>;
  setItems: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const KeyValueInputList = ({
  items,
  setItems,
}: KeyValueInputListProps) => {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  const handleAdd = () => {
    if (!key.trim() || !value.trim()) return;

    setItems((prev) => ({
      ...prev,
      [key]: value,
    }));
    setKey("");
    setValue("");
  };

  const handleDelete = (keyToDelete: string) => {
    setItems((prev) => {
      const newItems = { ...prev };
      delete newItems[keyToDelete];
      return newItems;
    });
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "8px",
          width: "100%",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Key"
          style={{
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            width: "100px",
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Value"
          style={{
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            width: "100px",
          }}
        />
        <button
          onClick={handleAdd}
          style={{
            padding: "8px 16px",
            backgroundColor: "#0066ff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Add
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {Object.entries(items).map(([key, value]) => (
          <div
            key={key}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px",
              backgroundColor: "#f5f5f5",
              borderRadius: "4px",
              gap: "8px",
            }}
          >
            <span style={{ flex: 1 }}>{key}</span>
            <span style={{ flex: 1 }}>{value}</span>
            <button
              onClick={() => handleDelete(key)}
              style={{
                padding: "4px 8px",
                backgroundColor: "#ff4444",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
