import { pipelineRunFilterReducer } from '../../shared';
import { Action } from '../../shared/components/action-menu/types';
import { PipelineRunKind } from '../../types';
import { pipelineRunCancel, pipelineRunStop } from '../../utils/pipeline-actions';

export const usePipelinerunActions = (pipelineRun: PipelineRunKind): Action[] => {
  return [
    // Todo: will re enable this after finding the proper solution to rerun post mvp.
    // {
    //   cta: () => pipelineRunRerun(pipelineRun),
    //   id: 'pipelinerun-rerun',
    //   label: 'Rerun',
    // },
    {
      cta: () => pipelineRunStop(pipelineRun),
      id: 'pipelinerun-stop',
      label: 'Stop',
      tooltip: 'Let the running tasks complete, then execute finally tasks',
      disabled: !(pipelineRunFilterReducer(pipelineRun) === 'Running'),
    },

    {
      cta: () => pipelineRunCancel(pipelineRun),
      id: 'pipelinerun-cancel',
      label: 'Cancel',
      tooltip: 'Interrupt any executing non finally tasks, then execute finally tasks',
      disabled: !(pipelineRunFilterReducer(pipelineRun) === 'Running'),
    },
  ];
};
