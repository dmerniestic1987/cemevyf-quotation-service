import {DataSource, DataSourceOptions} from 'typeorm';
const { typeOrm } = require('config');

export const typeOrmOptions = {
  ...typeOrm,
  entities: [__dirname + '/src/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*.ts'],
  synchronize: false,
} as DataSourceOptions;

export const dataSource = new DataSource(typeOrmOptions);
