import * as React from 'react';
import {
  Card,
  CardBody,
  CardExpandableContent,
  CardHeader,
  CardTitle,
  ExpandableSection,
  Flex,
  FlexItem,
  FormSection,
  Grid,
  GridItem,
  TextInputTypes,
} from '@patternfly/react-core';
import {
  EditableLabelField,
  EnvironmentField,
  HelpTooltipIcon,
  InputField,
  NumberSpinnerField,
  ResourceLimitField,
} from '../../../shared';
import ExternalLink from '../../../shared/components/links/ExternalLink';
import { CPUUnits, DetectedFormComponent, MemoryUnits } from '../utils/types';
import { RuntimeSelector } from './RuntimeSelector';

type ReviewComponentCardProps = {
  detectedComponent: DetectedFormComponent;
  detectedComponentIndex: number;
  editMode?: boolean;
  isExpanded?: boolean;
  showRuntimeSelector?: boolean;
};

export const ReviewComponentCard: React.FC<ReviewComponentCardProps> = ({
  detectedComponent,
  detectedComponentIndex,
  editMode = false,
  isExpanded = false,
  showRuntimeSelector,
}) => {
  const component = detectedComponent.componentStub;
  const name = component.componentName;
  const fieldPrefix = `components[${detectedComponentIndex}].componentStub`;
  const [expandedComponent, setExpandedComponent] = React.useState(isExpanded);
  const [expandedConfig, setExpandedConfig] = React.useState(true);

  return (
    <Card
      isFlat
      isCompact
      isSelectable
      isSelected={expandedComponent}
      isExpanded={expandedComponent}
    >
      <CardHeader
        onExpand={() => setExpandedComponent((v) => !v)}
        toggleButtonProps={{
          id: `toggle-${name}`,
          'aria-label': name,
          'aria-labelledby': `review-${name} toggle-${name}`,
          'aria-expanded': expandedComponent,
          'data-test': `${name}-toggle-button`,
        }}
      >
        <CardTitle>
          <Flex alignItems={{ default: 'alignItemsCenter' }}>
            <FlexItem
              style={{ marginBottom: 'var(--pf-global--spacer--md)' }}
              spacer={{ default: 'spacer4xl' }}
            >
              {editMode ? (
                <p>{name}</p>
              ) : (
                <EditableLabelField
                  name={`${fieldPrefix}.componentName`}
                  type={TextInputTypes.text}
                />
              )}
              <ExternalLink
                style={{ fontWeight: 'normal' }}
                href={
                  component.source?.git?.url ??
                  (component.containerImage?.includes('http')
                    ? component.containerImage
                    : `https://${component.containerImage}`)
                }
                text={component.source?.git?.url ?? component.containerImage}
              />
            </FlexItem>
            {showRuntimeSelector && (
              <FlexItem>
                <RuntimeSelector detectedComponentIndex={detectedComponentIndex} />
              </FlexItem>
            )}
          </Flex>
        </CardTitle>
      </CardHeader>
      <CardExpandableContent>
        <CardBody style={{ marginLeft: '2em', maxWidth: '70%' }}>
          <ExpandableSection
            isExpanded={expandedConfig}
            onToggle={() => setExpandedConfig((v) => !v)}
            toggleText="Deploy configuration"
            isIndented
          >
            <FormSection>
              <Grid hasGutter>
                <GridItem sm={6} md={3} lg={3}>
                  <InputField
                    name={`${fieldPrefix}.targetPort`}
                    label="Target port"
                    type={TextInputTypes.number}
                  />
                </GridItem>
                <GridItem span={6} className="pf-m-hidden pf-m-visible-on-lg" />
                <GridItem sm={12} md={12} lg={6}>
                  <ResourceLimitField
                    name={`${fieldPrefix}.resources.cpu`}
                    unitName={`${fieldPrefix}.resources.cpuUnit`}
                    label="CPU"
                    minValue={0}
                    unitOptions={CPUUnits}
                    helpText="The amount of CPU the container is guaranteed"
                  />
                </GridItem>
                <GridItem sm={12} md={12} lg={6}>
                  <ResourceLimitField
                    name={`${fieldPrefix}.resources.memory`}
                    unitName={`${fieldPrefix}.resources.memoryUnit`}
                    label="Memory"
                    minValue={0}
                    unitOptions={MemoryUnits}
                    helpText="The amount of memory the container is guaranteed"
                  />
                </GridItem>
              </Grid>
              <ExpandableSection toggleText="Show advanced deployment options">
                <FormSection>
                  <NumberSpinnerField
                    name={`${fieldPrefix}.replicas`}
                    label="Instances"
                    min={0}
                    helpText="Number of instances of your image"
                  />
                  {/* <InputField
                      name={`${fieldPrefix}.route`}
                      label="Route"
                      placeholder="Route exposed by the deployment"
                    /> */}
                  <EnvironmentField
                    name={`${fieldPrefix}.env`}
                    envs={component.env}
                    label="Environment variables"
                    description="Component will have access during build and runtimes."
                    labelIcon={
                      <HelpTooltipIcon content="Set environment variables to define the behaviour of your application environment." />
                    }
                  />
                </FormSection>
              </ExpandableSection>
            </FormSection>
          </ExpandableSection>
        </CardBody>
      </CardExpandableContent>
    </Card>
  );
};
