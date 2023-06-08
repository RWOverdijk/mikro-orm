import { Cascade, Entity, MikroORM, OneToOne, PrimaryKey, Property, Rel, serialize } from '@mikro-orm/core';
import { BetterSqliteDriver } from '@mikro-orm/better-sqlite';

@Entity()
class ImageInfo {

  @PrimaryKey()
  id!: number;

  @Property()
  url!: string;

  @OneToOne(() => MainItem, image => image.coverImage)
  itemEntity?: Rel<MainItem>;

}

@Entity()
class MainItem {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToOne(() => ImageInfo, image => image.itemEntity, { owner: true, orphanRemoval: true, cascade: [Cascade.PERSIST] })
  coverImage!: ImageInfo;

}

test('serialization of not managed relations (#3788)', async () => {
  const { em } = await MikroORM.init({
    driver: BetterSqliteDriver,
    dbName: ':memory:',
    entities: [ImageInfo],
    connect: false,
  });

  const image = em.create(ImageInfo, { url: 'xxxx' });
  const mainItem = em.create(MainItem, { name: 'yyyy', coverImage: image });
  expect(mainItem).toMatchObject({
    name: 'yyyy',
    coverImage: {
      url: 'xxxx',
      itemEntity: { name: 'yyyy', coverImage: { url: 'xxxx' } },
    },
  });
  expect(JSON.stringify(mainItem)).toBe(`{"name":"yyyy","coverImage":{"url":"xxxx","itemEntity":{"name":"yyyy"}}}`);
  expect(JSON.stringify(serialize(mainItem)[0])).toBe(`{"name":"yyyy","coverImage":{"url":"xxxx","itemEntity":{"name":"yyyy"}}}`);
  expect(JSON.stringify(serialize(mainItem, { populate: ['coverImage'] })[0])).toBe(`{"name":"yyyy","coverImage":{"url":"xxxx","itemEntity":{"name":"yyyy"}}}`);
});
