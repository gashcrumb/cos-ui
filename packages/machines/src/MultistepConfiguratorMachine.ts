import { ConnectorType } from '@kas-connectors/api';
import {
  ActorRefFrom,
  assign,
  createMachine,
  createSchema,
  sendParent,
} from 'xstate';
import { createModel } from 'xstate/lib/model';

type Context = {
  connector: ConnectorType;
  steps: string[];
  activeStep: number;
  isActiveStepValid: boolean;
  configuration?: Map<string,unknown>;
};

const multistepConfiguratorMachineSchema = {
  context: createSchema<Context>(),
};

const multistepConfiguratorMachineModel = createModel(
  {
    connector: { id: 'something', name: 'something', version: '0.1' },
    steps: [],
    activeStep: 0,
    isActiveStepValid: false,
    configuration: new Map(),
  } as Context,
  {
    events: {
      entry: () => ({}),
      change: ({
        configuration,
        isValid,
      }: {
        configuration: Map<string,unknown>;
        isValid: boolean;
      }) => ({ configuration, isValid }),
      next: () => ({}),
      prev: () => ({}),
      complete: () => ({}),
    },
  }
);

export const multistepConfiguratorMachine = createMachine<
  typeof multistepConfiguratorMachineModel
>(
  {
    schema: multistepConfiguratorMachineSchema,
    id: 'configurator',
    initial: 'configuring',
    context: {
      connector: { id: 'something', name: 'something', version: '0.1' },
      steps: ['one', 'two', 'three'],
      activeStep: 0,
      isActiveStepValid: false,
    },
    states: {
      configuring: {
        entry: sendParent('isInvalid'),
        always: [{ target: 'valid', cond: 'activeStepValid' }],
      },
      valid: {
        id: 'valid',
        initial: 'determineStep',
        entry: sendParent('isValid'),
        states: {
          determineStep: {
            always: [
              { target: '#valid.lastStep', cond: 'isLastStep' },
              { target: '#valid.hasNextStep' },
            ],
          },
          hasNextStep: {
            on: {
              next: {
                target: '#configurator.configuring',
                actions: ['nextStep', 'changedStep'],
              },
            },
          },
          lastStep: {
            on: {
              next: '#configurator.configured',
            },
          },
        },
      },
      configured: {
        type: 'final',
        data: ({ configuration }) => ({ configuration }),
      },
    },
    on: {
      change: {
        target: 'configuring',
        actions: 'change',
      },
      prev: {
        target: 'configuring',
        actions: ['prevStep', 'changedStep'],
      },
    },
  },
  {
    actions: {
      nextStep: assign(context => ({
        activeStep: Math.min(context.activeStep + 1, context.steps.length - 1),
        isActiveStepValid: false,
      })),
      prevStep: assign(context => ({
        activeStep: Math.max(context.activeStep - 1, 0),
        isActiveStepValid: false,
      })),
      change: assign((_, event) =>
        event.type === 'change'
          ? {
              configuration: event.configuration,
              isActiveStepValid: event.isValid,
            }
          : {}
      ),
      changedStep: sendParent(context => ({
        type: 'changedStep',
        step: context.activeStep,
      })),
    },
    guards: {
      isLastStep: context => context.activeStep === context.steps.length - 1,
      activeStepValid: context => context.isActiveStepValid,
    },
  }
);

export type MultistepConfiguratorActorRef = ActorRefFrom<
  typeof multistepConfiguratorMachine
>;
