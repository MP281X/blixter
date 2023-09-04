schema "public" {}

table "users" {
  schema = schema.public

  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "username" {
    type = varchar(20)
  }

  column "email" {
    type = varchar(50)
  }

  column "password" {
    type = text
  }

  column "verified" {
    type    = boolean
    default = false
  }
}

table "videos" {
  schema = schema.public

  column "id" {
    type    = uuid
    default = sql("gen_random_uuid()")
  }

  column "name" {
    type = varchar(20)
  }

  column "description" {
    type = text
  }

  column "converted" {
    type    = boolean
    default = false
  }
}
