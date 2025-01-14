import { AlertVariant, PageSection } from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { adminClient } from "../admin-client";
import { useAlerts } from "../components/alert/Alerts";
import {
  ClientScopeDefaultOptionalType,
  changeScope,
} from "../components/client-scope/ClientScopeTypes";
import { ViewHeader } from "../components/view-header/ViewHeader";
import { useRealm } from "../context/realm-context/RealmContext";
import { convertFormValuesToObject } from "../util";
import { ScopeForm } from "./details/ScopeForm";
import { toClientScope } from "./routes/ClientScope";

export default function CreateClientScope() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { realm } = useRealm();
  const { addAlert, addError } = useAlerts();

  const onSubmit = async (formData: ClientScopeDefaultOptionalType) => {
    const clientScope = convertFormValuesToObject({
      ...formData,
      name: formData.name?.trim().replace(/ /g, "_"),
    });

    try {
      await adminClient.clientScopes.create(clientScope);

      const scope = await adminClient.clientScopes.findOneByName({
        name: clientScope.name!,
      });

      if (!scope) {
        throw new Error(t("common:notFound"));
      }

      await changeScope({ ...clientScope, id: scope.id }, clientScope.type);

      addAlert(t("createClientScopeSuccess", AlertVariant.success));

      navigate(
        toClientScope({
          realm,
          id: scope.id!,
          tab: "settings",
        }),
      );
    } catch (error) {
      addError("createClientScopeError", error);
    }
  };

  return (
    <>
      <ViewHeader titleKey="client-scopes:createClientScope" />
      <PageSection variant="light" className="pf-u-p-0">
        <PageSection variant="light">
          <ScopeForm save={onSubmit} />
        </PageSection>
      </PageSection>
    </>
  );
}
