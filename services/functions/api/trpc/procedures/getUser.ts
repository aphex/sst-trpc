import { Chance } from 'chance'
import { z } from 'zod'
import { t } from '../t'
const chance = new Chance()

export const getUser = t.procedure
  .input(
    z.object({
      id: z.number(),
    })
  )
  .query(({ input }) => ({
    id: input.id,
    name: chance.name(),
    birthday: chance.birthday(),
    age: chance.age(),
    ssn: chance.ssn(),
    avatar: chance.avatar(),
    address: chance.address(),
    phone: chance.phone(),
    email: chance.email(),
  }))
