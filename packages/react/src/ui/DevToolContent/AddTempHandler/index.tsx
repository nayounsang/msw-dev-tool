import { Plus } from "lucide-react";
import React from "react";
import { InputFormField } from "../Form/InputFormField";
import { TextAreaFormField } from "../Form/TextAreaFormField";
import { SelectFormField } from "../Form/SelectFormField";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    handlerSchema,
    HandlerSchema,
    useHandlerStore,
    HttpMethod,
    StringHttpStatusCode,
    MimeType,
} from "@msw-dev-tool/core/browser";
import { Flex } from "../../Components/Flex";
import { Button } from "../../Components/Button";
import { getOptions } from "../ToolButtonGroup/util";

interface HandlerFormProps {
    onClose?: () => void;
}

const methodOptions = getOptions(HttpMethod);
const statusOptions = getOptions(StringHttpStatusCode);
const mimeTypeOptions = getOptions(MimeType);

export const AddTempHandlerForm = ({ onClose }: HandlerFormProps) => {
    const addTempHandler = useHandlerStore((state) => state.addTempHandler);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<HandlerSchema>({
        resolver: zodResolver(handlerSchema),
        defaultValues: {
            method: HttpMethod.GET,
            status: StringHttpStatusCode.OK,
            contentType: MimeType.APPLICATION_JSON,
            delay: 0,
        },
    });

    const onSubmit = handleSubmit((data) => {
        addTempHandler({ data });
        onClose?.();
    });

    return (
        <form
            onSubmit={onSubmit}
            style={{ display: "flex", flexDirection: "column", overflow: "hidden", gap: "1.25rem" }}
        >
            <Flex
                gap={5}
                direction="column"
                style={{ overflow: "scroll", flexGrow: 1 }}
            >
                <SelectFormField
                    label="Method"
                    {...register("method")}
                    error={errors.method?.message}
                    options={methodOptions}
                    defaultValue={HttpMethod.GET}
                />
                <InputFormField
                    label="Path"
                    {...register("path")}
                    error={errors.path?.message}
                    placeholder="api end point"
                    required
                />
                <InputFormField
                    label="Delay"
                    {...register("delay", { setValueAs: Number })}
                    error={errors.delay?.message}
                    placeholder="delay time (ms)"
                    type="number"
                    min={0}
                    onWheel={(e) => e.currentTarget.blur()}
                />
                <SelectFormField
                    label="Status Code"
                    {...register("status")}
                    defaultValue={StringHttpStatusCode.OK}
                    error={errors.status?.message}
                    options={statusOptions}
                />
                <InputFormField
                    label="Status Text"
                    {...register("statusText")}
                    error={errors.statusText?.message}
                    placeholder="status text for status code"
                />
                <SelectFormField
                    label="Content Type (MIME types)"
                    {...register("contentType")}
                    defaultValue={MimeType.APPLICATION_JSON}
                    error={errors.contentType?.message}
                    options={mimeTypeOptions}
                />
                <TextAreaFormField
                    label="Response"
                    {...register("response")}
                    error={errors.response?.message}
                    placeholder="response body with 'content-type'"
                    className="msw-dt-min-h-textarea"
                />
                <TextAreaFormField
                    label="Response Headers"
                    {...register("header")}
                    error={errors.header?.message}
                    placeholder='response headers as JSON, e.g. {"X-Custom": "value"}'
                    className="msw-dt-min-h-textarea"
                />
            </Flex>
            <Button type="submit" color="primary">
                <Plus size={16} />
                Add
            </Button>
        </form>
    );
};
