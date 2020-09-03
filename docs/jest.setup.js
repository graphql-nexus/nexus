import 'jest-dom/extend-expect';
import 'react-testing-library/cleanup-after-each';

global.___loader = {
  enqueue: jest.fn(),
};
