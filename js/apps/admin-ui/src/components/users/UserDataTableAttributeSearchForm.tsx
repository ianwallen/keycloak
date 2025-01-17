import type UserProfileConfig from "@keycloak/keycloak-admin-client/lib/defs/userProfileConfig";
import {
  ActionGroup,
  Alert,
  AlertVariant,
  Button,
  ButtonVariant,
  InputGroup,
  Select,
  SelectOption,
  SelectVariant,
  Text,
  TextContent,
  TextVariants,
} from "@patternfly/react-core";
import { Form } from "react-router-dom";
import { KeycloakTextInput } from "../keycloak-text-input/KeycloakTextInput";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { isBundleKey, unWrap } from "../../user/utils";
import { CheckIcon } from "@patternfly/react-icons";
import { useAlerts } from "../alert/Alerts";
import { ReactNode, useState } from "react";
import { UserAttribute } from "./UserDataTable";

type UserDataTableAttributeSearchFormProps = {
  activeFilters: UserAttribute[];
  setActiveFilters: (filters: UserAttribute[]) => void;
  profile: UserProfileConfig;
  createAttributeSearchChips: () => ReactNode;
  searchUserWithAttributes: () => void;
};

export function UserDataTableAttributeSearchForm({
  activeFilters,
  setActiveFilters,
  profile,
  createAttributeSearchChips,
  searchUserWithAttributes,
}: UserDataTableAttributeSearchFormProps) {
  const { t } = useTranslation();
  const { addAlert } = useAlerts();
  const [selectAttributeKeyOpen, setSelectAttributeKeyOpen] = useState(false);

  const defaultValues: UserAttribute = {
    name: "",
    displayName: "",
    value: "",
  };

  const {
    getValues,
    register,
    reset,
    formState: { errors },
    setValue,
    setError,
    clearErrors,
  } = useForm<UserAttribute>({
    mode: "onChange",
    defaultValues,
  });

  const isAttributeKeyDuplicate = () => {
    return activeFilters.some((filter) => filter.name === getValues().name);
  };

  const isAttributeNameValid = () => {
    let valid = false;
    if (!getValues().name.length) {
      setError("name", {
        type: "empty",
        message: t("searchUserByAttributeMissingKeyError"),
      });
    } else if (
      activeFilters.some((filter) => filter.name === getValues().name)
    ) {
      setError("name", {
        type: "conflict",
        message: t("searchUserByAttributeKeyAlreadyInUseError"),
      });
    } else {
      valid = true;
    }
    return valid;
  };

  const isAttributeValueValid = () => {
    let valid = false;
    if (!getValues().value.length) {
      setError("value", {
        type: "empty",
        message: t("searchUserByAttributeMissingValueError"),
      });
    } else {
      valid = true;
    }
    return valid;
  };

  const isAttributeValid = () =>
    isAttributeNameValid() && isAttributeValueValid();

  const addToFilter = () => {
    if (isAttributeValid()) {
      setActiveFilters([
        ...activeFilters,
        {
          ...getValues(),
        },
      ]);
      reset();
    } else {
      errors.name?.message &&
        addAlert(errors.name.message, AlertVariant.danger);
      errors.value?.message &&
        addAlert(errors.value.message, AlertVariant.danger);
    }
  };

  const clearActiveFilters = () => {
    const filtered = [...activeFilters].filter(
      (chip) => chip.name !== chip.name,
    );
    setActiveFilters(filtered);
  };

  const createAttributeKeyInputField = () => {
    if (profile) {
      return (
        <Select
          data-testid="search-attribute-name"
          variant={SelectVariant.typeahead}
          onToggle={(isOpen) => setSelectAttributeKeyOpen(isOpen)}
          selections={getValues().displayName}
          onSelect={(_, selectedValue) => {
            setValue("displayName", selectedValue.toString());
            if (isAttributeKeyDuplicate()) {
              setError("name", { type: "conflict" });
            } else {
              clearErrors("name");
            }
          }}
          isOpen={selectAttributeKeyOpen}
          placeholderText={t("selectAttribute")}
          validated={errors.name && "error"}
          maxHeight={300}
          {...register("displayName", {
            required: true,
            validate: isAttributeNameValid,
          })}
        >
          {profile.attributes?.map((option) => (
            <SelectOption
              key={option.name}
              value={
                (isBundleKey(option.displayName)
                  ? t(unWrap(option.displayName!))
                  : option.displayName) || option.name
              }
              onClick={(e) => {
                e.stopPropagation();
                setSelectAttributeKeyOpen(false);
                setValue("name", option.name!);
              }}
            />
          ))}
        </Select>
      );
    } else {
      return (
        <KeycloakTextInput
          id="name"
          placeholder={t("common:keyPlaceholder")}
          validated={errors.name && "error"}
          onKeyDown={(e) => e.key === "Enter" && addToFilter()}
          {...register("name", {
            required: true,
            validate: isAttributeNameValid,
          })}
        />
      );
    }
  };

  return (
    <Form className="user-attribute-search-form">
      <TextContent className="user-attribute-search-form-headline">
        <Text component={TextVariants.h6}>{t("selectAttributes")}</Text>
      </TextContent>
      <Alert
        isInline
        className="user-attribute-search-form-alert"
        variant="info"
        title={t("searchUserByAttributeDescription")}
      />
      <TextContent className="user-attribute-search-form-key-value">
        <div className="user-attribute-search-form-left">
          <Text component={TextVariants.h6}>{t("common:key")}</Text>
        </div>
        <div className="user-attribute-search-form-right">
          <Text component={TextVariants.h6}>{t("common:value")}</Text>
        </div>
      </TextContent>
      <div className="user-attribute-search-form-left">
        {createAttributeKeyInputField()}
      </div>
      <div className="user-attribute-search-form-right">
        <InputGroup>
          <KeycloakTextInput
            id="value"
            placeholder={t("common:valuePlaceholder")}
            validated={errors.value && "error"}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addToFilter();
              }
            }}
            {...register("value", {
              required: true,
              validate: isAttributeValueValid,
            })}
          />
          <Button
            variant="control"
            icon={<CheckIcon />}
            onClick={addToFilter}
          />
        </InputGroup>
      </div>
      {createAttributeSearchChips()}
      <ActionGroup className="user-attribute-search-form-action-group">
        <Button
          data-testid="search-user-attribute-btn"
          variant="primary"
          type="submit"
          isDisabled={!activeFilters.length}
          onClick={searchUserWithAttributes}
        >
          {t("common:search")}
        </Button>
        <Button
          variant={ButtonVariant.link}
          onClick={() => {
            reset();
            clearActiveFilters();
          }}
        >
          {t("common:reset")}
        </Button>
      </ActionGroup>
    </Form>
  );
}
