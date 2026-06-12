import { initializeSocket } from '../../../src/config/socket';
import { Server } from 'socket.io';
import Order from '../../../src/models/order.model';
import { verifyToken } from '../../../src/utils/jwt';
import { UserRole } from '../../../src/types/user.types';
import { SOCKET_EVENTS } from '../../../src/types/notification.types';

jest.mock('socket.io');
jest.mock('../../../src/models/order.model');
jest.mock('../../../src/utils/jwt');

describe('initializeSocket', () => {
  let connectionHandler: (socket: any) => void;
  let authMiddleware: (socket: any, next: (err?: Error) => void) => void;

  beforeEach(() => {
    jest.clearAllMocks();

    (Server as unknown as jest.Mock).mockImplementation(() => ({
      use: jest.fn((middleware) => {
        authMiddleware = middleware;
      }),
      on: jest.fn((event, handler) => {
        if (event === 'connection') {
          connectionHandler = handler;
        }
      }),
    }));
  });

  it('initializes socket server with authentication middleware', () => {
    const httpServer = {} as any;
    initializeSocket(httpServer);

    expect(Server).toHaveBeenCalledWith(httpServer, expect.objectContaining({ cors: { origin: '*' } }));
    expect(authMiddleware).toBeDefined();
    expect(connectionHandler).toBeDefined();
  });

  it('rejects connections without a token', () => {
    initializeSocket({} as any);
    const next = jest.fn();

    authMiddleware({ handshake: { auth: {} } }, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('accepts valid tokens and joins user room', () => {
    initializeSocket({} as any);
    const next = jest.fn();
    const join = jest.fn();

    (verifyToken as jest.Mock).mockReturnValue({ userId: 'user1', role: UserRole.CUSTOMER });

    authMiddleware({ handshake: { auth: { token: 'valid-token' } }, data: {} }, next);
    expect(next).toHaveBeenCalledWith();

    const socket = {
      data: { user: { userId: 'user1', role: UserRole.CUSTOMER } },
      join,
      on: jest.fn(),
    };

    connectionHandler(socket);

    expect(join).toHaveBeenCalledWith('user:user1');
    expect(socket.on).toHaveBeenCalledWith(SOCKET_EVENTS.JOIN_ORDER, expect.any(Function));
  });

  it('allows customer to join order room for their order', async () => {
    initializeSocket({} as any);

    const join = jest.fn();
    const socket = {
      data: { user: { userId: 'user1', role: UserRole.CUSTOMER } },
      join,
      on: jest.fn((event, handler) => {
        if (event === SOCKET_EVENTS.JOIN_ORDER) {
          (Order.findById as jest.Mock).mockResolvedValue({
            customerId: { toString: () => 'user1' },
            deliveryPersonId: null,
          });
          handler('order1');
        }
      }),
    };

    connectionHandler(socket);

    await new Promise((resolve) => setImmediate(resolve));

    expect(join).toHaveBeenCalledWith('order:order1');
  });
});
