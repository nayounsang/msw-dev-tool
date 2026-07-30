import { Plus, Trash2 } from "lucide-react";
import React, { ReactNode, useId, useState } from "react";
import { Flex } from "../../Components/Flex";
import { Input } from "../../Components/Input";
import { Button } from "../../Components/Button";

interface KeyValueInputListProps {
  items: Record<string, string>;
  setItems: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  title: ReactNode;
}

export const KeyValueInputList = ({
  items,
  setItems,
  title,
}: KeyValueInputListProps) => {
  const id = useId();

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
      <label htmlFor={id} className="msw-dt-label">{title}</label>
      <Flex align="center" py={2} gap={2}>
        <Input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Key"
          id={id}
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Value"
        />
        <Button onClick={handleAdd} variant="outline">
          <Plus size={16} />
          Add
        </Button>
      </Flex>

      <Flex direction="column" gap={1}>
        {Object.entries(items).map(([key, value]) => (
          <div key={key} className="msw-dt-kv-row">
            <span className="msw-dt-kv-cell">{key}</span>
            <span className="msw-dt-kv-cell">{value}</span>
            <Button
              onClick={() => handleDelete(key)}
              color="secondary"
            >
              <Trash2 size={16} />
              Delete
            </Button>
          </div>
        ))}
      </Flex>
    </div>
  );
};
