import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import { Label } from "@radix-ui/react-label";
import { Box, Button, Flex, TextField } from "@radix-ui/themes";
import React, { ReactNode, useId, useState } from "react";

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
    <Box>
      <Label htmlFor={id}>{title}</Label>
      <Flex align="center" py="2" gap="2">
        <TextField.Root
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Key"
          style={{
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            width: "160px",
          }}
          id={id}
        />
        <TextField.Root
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Value"
          style={{
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            width: "180px",
          }}
        />
        <Button onClick={handleAdd} variant="soft">
          <PlusIcon />
          Add
        </Button>
      </Flex>

      <Flex direction="column" gap="1">
        {Object.entries(items).map(([key, value]) => (
          <Flex
            key={key}
            style={{
              backgroundColor: "#f5f5f5",
              borderRadius: "4px",
              width: "fit-content",
            }}
            align="center"
            gap="2"
            py="1"
          >
            <span
              style={{
                width: "160px",
                paddingLeft: "8px",
                boxSizing: "border-box",
              }}
            >
              {key}
            </span>
            <span
              style={{
                width: "180px",
                paddingLeft: "8px",
                boxSizing: "border-box",
              }}
            >
              {value}
            </span>
            <Button
              onClick={() => handleDelete(key)}
              variant="soft"
              color="crimson"
            >
              <TrashIcon />
              Delete
            </Button>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
};
