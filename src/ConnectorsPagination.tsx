import React, { FunctionComponent } from 'react';

import { Pagination } from '@patternfly/react-core';

import { useConnectorsMachine } from './Connectors.machine';
import { useConnectorsMachineService } from './Connectors.machine-context';
import { PaginatedApiRequest } from './PaginatedResponse.machine';

type ConnectorsPaginationProps = {
  isCompact: boolean;
};
export const ConnectorsPagination: FunctionComponent<ConnectorsPaginationProps> =
  ({ isCompact = false }) => {
    const service = useConnectorsMachineService();
    const { request, response } = useConnectorsMachine(service);

    const onChange = (request: PaginatedApiRequest<{}>) =>
      service.send({ type: 'api.query', ...request });
    const defaultPerPageOptions = [
      {
        title: '1',
        value: 1,
      },
      {
        title: '5',
        value: 5,
      },
      {
        title: '10',
        value: 10,
      },
    ];
    return (
      <Pagination
        itemCount={response?.total || 0}
        page={request.page}
        perPage={request.size}
        perPageOptions={defaultPerPageOptions}
        onSetPage={(_, page, size) =>
          onChange({ ...request, page, size: size || request.size })
        }
        onPerPageSelect={() => false}
        variant={isCompact ? 'top' : 'bottom'}
        isCompact={isCompact}
      />
    );
  };