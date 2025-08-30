import { Idl } from '@coral-xyz/anchor';

export type RoomiesplitIDL = {
  "address": "CFTz6LKRNHgWJhYqPvQFYVjYAiCnkdLbK2KM5FDoUgPg",
  "metadata": {
    "name": "roomiesplit",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "version": "0.1.0",
  "name": "roomiesplit",
  "instructions": [
    {
      "name": "createGroup",
      "accounts": [
        {
          "name": "group",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "members",
          "type": {
            "vec": "publicKey"
          }
        }
      ]
    },
    {
      "name": "addExpense",
      "accounts": [
        {
          "name": "group",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "expense",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "description",
          "type": "string"
        }
      ]
    },
    {
      "name": "calculateBalances",
      "accounts": [
        {
          "name": "group",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "group",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "publicKey"
          },
          {
            "name": "members",
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "totalExpenses",
            "type": "u64"
          },
          {
            "name": "expenseCount",
            "type": "u64"
          },
          {
            "name": "balances",
            "type": {
              "vec": {
                "defined": "Balance"
              }
            }
          }
        ]
      }
    },
    {
      "name": "expense",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "expenseId",
            "type": "u64"
          },
          {
            "name": "group",
            "type": "publicKey"
          },
          {
            "name": "payer",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "description",
            "type": "string"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "Balance",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "member",
            "type": "publicKey"
          },
          {
            "name": "owed",
            "type": "i64"
          },
          {
            "name": "spent",
            "type": "i64"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "TooManyMembers",
      "msg": "Too many members in group"
    },
    {
      "code": 6001,
      "name": "NotMember",
      "msg": "User is not a member of this group"
    },
    {
      "code": 6002,
      "name": "InvalidAmount",
      "msg": "Invalid expense amount"
    },
    {
      "code": 6003,
      "name": "NoMembers",
      "msg": "Group has no members"
    }
  ]
};

export const IDL: RoomiesplitIDL = {
  "address": "CFTz6LKRNHgWJhYqPvQFYVjYAiCnkdLbK2KM5FDoUgPg",
  "metadata": {
    "name": "roomiesplit",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "version": "0.1.0",
  "name": "roomiesplit",
  "instructions": [
    {
      "name": "createGroup",
      "accounts": [
        {
          "name": "group",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "members",
          "type": {
            "vec": "publicKey"
          }
        }
      ]
    },
    {
      "name": "addExpense",
      "accounts": [
        {
          "name": "group",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "expense",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "description",
          "type": "string"
        }
      ]
    },
    {
      "name": "calculateBalances",
      "accounts": [
        {
          "name": "group",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "group",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "publicKey"
          },
          {
            "name": "members",
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "totalExpenses",
            "type": "u64"
          },
          {
            "name": "expenseCount",
            "type": "u64"
          },
          {
            "name": "balances",
            "type": {
              "vec": {
                "defined": "Balance"
              }
            }
          }
        ]
      }
    },
    {
      "name": "expense",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "expenseId",
            "type": "u64"
          },
          {
            "name": "group",
            "type": "publicKey"
          },
          {
            "name": "payer",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "description",
            "type": "string"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "Balance",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "member",
            "type": "publicKey"
          },
          {
            "name": "owed",
            "type": "i64"
          },
          {
            "name": "spent",
            "type": "i64"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "TooManyMembers",
      "msg": "Too many members in group"
    },
    {
      "code": 6001,
      "name": "NotMember",
      "msg": "User is not a member of this group"
    },
    {
      "code": 6002,
      "name": "InvalidAmount",
      "msg": "Invalid expense amount"
    },
    {
      "code": 6003,
      "name": "NoMembers",
      "msg": "Group has no members"
    }
  ]
};