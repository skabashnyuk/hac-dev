import * as React from 'react';
import { useK8sWatchResource } from '@openshift/dynamic-plugin-sdk-utils';
import { ComponentGroupVersionKind } from '../models';
import { ComponentKind } from '../types';
import { useWorkspaceInfo } from '../utils/workspace-context-utils';

export const useComponents = (
  namespace: string,
  applicationName: string,
): [ComponentKind[], boolean, unknown] => {
  const [components, componentsLoaded, error] = useK8sWatchResource<ComponentKind[]>({
    groupVersionKind: ComponentGroupVersionKind,
    namespace,
    isList: true,
  });
  const appComponents: ComponentKind[] = React.useMemo(
    () =>
      componentsLoaded
        ? components?.filter((c) => c.spec.application === applicationName) || []
        : [],
    [components, applicationName, componentsLoaded],
  );
  return [appComponents, componentsLoaded, error];
};

const sortComponentsByCreation = (components: ComponentKind[]): ComponentKind[] =>
  components.sort(
    (a, b) =>
      new Date(b.metadata?.creationTimestamp).getTime() -
      new Date(a.metadata?.creationTimestamp).getTime(),
  );

export const useSortedComponents = (
  applicationName: string,
  namespace?: string,
): [ComponentKind[], boolean, unknown] => {
  const { namespace: ns } = useWorkspaceInfo();
  const [cmps, loaded, error] = useComponents(namespace ?? ns, applicationName);

  const components = React.useMemo(() => {
    return loaded && !error ? sortComponentsByCreation(cmps) : [];
  }, [cmps, error, loaded]);

  return [components, loaded, error];
};
