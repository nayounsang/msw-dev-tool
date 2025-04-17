import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import { Label } from "@radix-ui/react-label";
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
      <Label htmlFor={id}>{title}</Label>
      <Flex align="center" py={2} gap={2}>
        <Input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Key"
          className="p-2 rounded-md border border-gray-300"
          id={id}
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Value"
          className="p-2 rounded-md border border-gray-300"
        />
        <Button onClick={handleAdd} variant="outline">
          <PlusIcon />
          Add
        </Button>
      </Flex>

      <Flex direction="column" gap={1}>
        {Object.entries(items).map(([key, value]) => (
          <Flex
            key={key}
            className="bg-gray-100 rounded-md w-full"
            align="center"
            gap={2}
            py={1}
          >
            <span
              className="flex-1 pl-2 box-border"
            >
              {key}
            </span>
            <span
              className="flex-1 pl-2 box-border"
            >
              {value}
            </span>
            <Button
              onClick={() => handleDelete(key)}
              color="secondary"
            >
              <TrashIcon />
              Delete
            </Button>
          </Flex>
        ))}
      </Flex>
    </div>
  );
};
