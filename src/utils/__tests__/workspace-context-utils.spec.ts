import '@testing-library/jest-dom';
import { useNavigate } from 'react-router-dom';
import {
  getActiveWorkspace,
  k8sListResourceItems,
  setActiveWorkspace,
} from '@openshift/dynamic-plugin-sdk-utils';
import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { getHomeWorkspace, useActiveWorkspace } from '../workspace-context-utils';

jest.mock('@openshift/dynamic-plugin-sdk-utils', () => ({
  k8sListResourceItems: jest.fn(() => {
    [];
  }),
  getActiveWorkspace: jest.fn(() => 'test-ws'),
  setActiveWorkspace: jest.fn(),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: jest.fn(),
  };
});

const mockWorkspaces = [
  {
    apiVersion: 'toolchain.dev.openshift.com/v1alpha1',
    kind: 'Workspace',
    metadata: {
      name: 'workspace-one',
      namespace: 'toolchain-host-operator',
    },
    status: {
      type: 'home',
      namespaces: [
        {
          name: 'workspace-one-tenant',
          type: 'default',
        },
        {
          name: 'myworkspace-extra',
        },
      ],
      owner: 'john',
      role: 'admin',
    },
  },
  {
    apiVersion: 'toolchain.dev.openshift.com/v1alpha1',
    kind: 'Workspace',
    metadata: {
      name: 'workspace-two',
      namespace: 'toolchain-host-operator',
    },
    status: {
      namespaces: [
        {
          name: 'workspace-two-tenant',
          type: 'default',
        },
      ],
      owner: 'doe',
      role: 'admin',
    },
  },
];

const getActiveWorkspaceMock = getActiveWorkspace as jest.Mock;
const k8sListResourceItemsMock = k8sListResourceItems as jest.Mock;
const useNavigateMock = useNavigate as jest.Mock;

global.window = Object.create(window);

describe('getHomeWorkspace', () => {
  it('should not throw error for invalid values', () => {
    expect(getHomeWorkspace(null)).toBeUndefined();
    expect(getHomeWorkspace([])).toBeUndefined();
    expect(getHomeWorkspace(undefined)).toBeUndefined();
  });

  it('should return home worksapce', () => {
    expect(getHomeWorkspace(mockWorkspaces).metadata.name).toBe('workspace-one');
    expect(getHomeWorkspace(mockWorkspaces).status.type).toBe('home');
  });
});

describe('useActiveWorkspace', () => {
  let navigateMock;
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/stonesoup/workspaces/test-ws/applications',
      },
      writable: true,
    });
    navigateMock = jest.fn();
    useNavigateMock.mockImplementation(() => navigateMock);
    jest.spyOn(console, 'error').mockImplementation(jest.fn());
    k8sListResourceItemsMock.mockReturnValue(mockWorkspaces);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it('should return default values', () => {
    getActiveWorkspaceMock.mockReturnValue('');

    const { result } = renderHook(() => useActiveWorkspace());

    expect(result.current).toEqual({
      namespace: '',
      lastUsedWorkspace: 'test-ws',
      workspace: '',
      workspaces: [],
      setWorkspace: expect.any(Function),
      workspacesLoaded: false,
    });
  });

  it('should set workspaces from the api results ', async () => {
    getActiveWorkspaceMock.mockReturnValue('');

    const { result, waitForNextUpdate } = renderHook(() => useActiveWorkspace());
    await waitForNextUpdate();

    expect(result.current.workspace).toBe('workspace-one');
    expect(result.current.workspaces).toHaveLength(2);
  });

  it('should set your home workspace for the first time user', async () => {
    const workspaces = [
      { ...mockWorkspaces[1], status: { ...mockWorkspaces[1].status, type: 'home' } },
    ];

    k8sListResourceItemsMock.mockReturnValue(workspaces);
    getActiveWorkspaceMock.mockReturnValue('');

    const { result, waitForNextUpdate } = renderHook(() => useActiveWorkspace());
    await waitForNextUpdate();

    expect(result.current.workspace).toBe('workspace-two');
  });

  it('should return default values if the workspace API errors out ', async () => {
    getActiveWorkspaceMock.mockReturnValue('');
    k8sListResourceItemsMock.mockRejectedValue(new Error('failed'));

    const { result, unmount } = renderHook(() => useActiveWorkspace());

    unmount();
    expect(result.current.workspace).toBe('');
    expect(result.current.workspaces).toHaveLength(0);
  });

  it('should should select the workspace from url', async () => {
    window.location.pathname = '/stonesoup/workspaces/workspace-two/applications';
    const { result, waitForNextUpdate } = renderHook(() => useActiveWorkspace());
    await waitForNextUpdate();

    expect(result.current.workspace).toBe('workspace-two');
  });

  it('should should fallback to localstorage if the workspace from url is not available in the list', async () => {
    k8sListResourceItemsMock.mockReturnValue([
      ...mockWorkspaces,
      { metadata: { name: 'test-ws' } },
    ]);
    window.location.pathname = '/stonesoup/workspaces/workspace-invalid/applications';
    const { result, waitForNextUpdate } = renderHook(() => useActiveWorkspace());

    await waitForNextUpdate();

    await waitFor(() => {
      expect(result.current.workspace).toBe('test-ws');
    });
  });

  it('should should honor the workspace from localstorage', async () => {
    setActiveWorkspace('workspace-one');
    const { result, waitForNextUpdate } = renderHook(() => useActiveWorkspace());
    await waitForNextUpdate();

    expect(result.current.workspace).toBe('workspace-one');
  });

  it('should should not navigate to the selected workspace route if the user is in non workspace pages', async () => {
    window.location.pathname = '/stonesoup/overview';
    getActiveWorkspaceMock.mockReturnValue('');
    renderHook(() => useActiveWorkspace());

    await waitFor(() => {
      expect(navigateMock).not.toBeCalled();
    });
  });

  it('should navigate to the selected workspace route', async () => {
    getActiveWorkspaceMock.mockReturnValue('');
    renderHook(() => useActiveWorkspace());

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith(`/stonesoup/workspaces/workspace-one/applications`);
    });
  });
});
