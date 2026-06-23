import 'reflect-metadata';
import { container } from 'tsyringe';
import { registerDependencies } from './registerDependencies';

registerDependencies();

export { container };
