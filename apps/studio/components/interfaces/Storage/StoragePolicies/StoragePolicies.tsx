import { useParams } from 'common'
import { filter, find, get, isEmpty } from 'lodash'
import { useState } from 'react'
import { toast } from 'sonner'

import PolicyEditorModal from 'components/interfaces/Auth/Policies/PolicyEditorModal'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { useDatabasePolicyCreateMutation } from 'data/database-policies/database-policy-create-mutation'
import { useDatabasePolicyDeleteMutation } from 'data/database-policies/database-policy-delete-mutation'
import { useDatabasePolicyUpdateMutation } from 'data/database-policies/database-policy-update-mutation'
import { useBucketsQuery } from 'data/storage/buckets-query'
import { Loader } from 'lucide-react'
import ConfirmModal from 'ui-patterns/Dialogs/ConfirmDialog'
import { formatPoliciesForStorage } from '../Storage.utils'
import StoragePoliciesBucketRow from './StoragePoliciesBucketRow'
import StoragePoliciesEditPolicyModal from './StoragePoliciesEditPolicyModal'
import StoragePoliciesPlaceholder from './StoragePoliciesPlaceholder'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'

const StoragePolicies = () => {
  const { data: project } = useSelectedProjectQuery()
  const { ref: projectRef } = useParams()

  const { data, isLoading: isLoadingBuckets } = useBucketsQuery({ projectRef })
  const buckets = data ?? []

  const [selectedPolicyToEdit, setSelectedPolicyToEdit] = useState<any>({})
  const [selectedPolicyToDelete, setSelectedPolicyToDelete] = useState<any>({})
  const [isEditingPolicyForBucket, setIsEditingPolicyForBucket] = useState<any>({})

  const {
    data: policiesData,
    refetch,
    isLoading: isLoadingPolicies,
  } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: 'storage',
  })
  const policies = policiesData ?? []

  const isLoading = isLoadingBuckets || isLoadingPolicies

  const { mutateAsync: createDatabasePolicy } = useDatabasePolicyCreateMutation({
    onError: () => {},
  })
  const { mutateAsync: updateDatabasePolicy } = useDatabasePolicyUpdateMutation()
  const { mutate: deleteDatabasePolicy } = useDatabasePolicyDeleteMutation({
    onSuccess: async () => {
      await refetch()
      toast.success('成功删除了策略！')
      setSelectedPolicyToDelete({})
    },
  })

  // Only use storage policy editor when creating new policies for buckets
  const showStoragePolicyEditor =
    isEmpty(selectedPolicyToEdit) &&
    !isEmpty(isEditingPolicyForBucket) &&
    get(isEditingPolicyForBucket, ['bucket'], '').length > 0

  const showGeneralPolicyEditor = !isEmpty(isEditingPolicyForBucket) && !showStoragePolicyEditor

  // Policies under storage.objects
  const storageObjectsPolicies = filter(policies, { table: 'objects' })
  const formattedStorageObjectPolicies = formatPoliciesForStorage(buckets, storageObjectsPolicies)
  const ungroupedPolicies = get(
    find(formattedStorageObjectPolicies, { name: 'Ungrouped' }),
    ['policies'],
    []
  )

  // Policies under storage.buckets
  const storageBucketPolicies = filter(policies, { table: 'buckets' })

  const onSelectPolicyAdd = (bucketName = '', table = '') => {
    setSelectedPolicyToEdit({})
    setIsEditingPolicyForBucket({ bucket: bucketName, table })
  }

  const onSelectPolicyEdit = (policy: any, bucketName = '', table = '') => {
    setIsEditingPolicyForBucket({ bucket: bucketName, table })
    setSelectedPolicyToEdit(policy)
  }

  const onCancelPolicyEdit = () => {
    setIsEditingPolicyForBucket({})
  }

  const onSelectPolicyDelete = (policy: any) => setSelectedPolicyToDelete(policy)
  const onCancelPolicyDelete = () => setSelectedPolicyToDelete({})

  const onSavePolicySuccess = async () => {
    toast.success('成功保存了策略！')
    await refetch()
    onCancelPolicyEdit()
  }

  /*
    Functions that involve the CRUD for policies
    For each API call within the Promise.all, return true if an error occurred, else return false
  */
  const onCreatePolicies = async (payloads: any[]) => {
    if (!project) {
      console.error('未找到项目')
      return true
    }

    try {
      return await Promise.all(
        payloads.map(async (payload) => {
          try {
            await createDatabasePolicy({
              projectRef: project?.ref,
              connectionString: project?.connectionString,
              payload,
            })
            return false
          } catch (error: any) {
            toast.error(`添加策略失败：${error.message}`)
            return true
          }
        })
      )
    } finally {
    }
  }

  const onCreatePolicy = async (payload: any) => {
    if (!project) {
      console.error('未找到项目')
      return true
    }

    try {
      await createDatabasePolicy({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        payload,
      })
      return false
    } catch (error: any) {
      toast.error(`添加策略失败：${error.message}`)
      return true
    }
  }

  const onUpdatePolicy = async (payload: any) => {
    if (!project) {
      console.error('未找到项目')
      return true
    }

    try {
      await updateDatabasePolicy({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        originalPolicy: selectedPolicyToEdit,
        payload,
      })
      return false
    } catch (error: any) {
      toast.error(`更新策略失败：${error.message}`)
      return true
    }
  }

  const onDeletePolicy = async () => {
    if (!project) return console.error('未找到项目')
    deleteDatabasePolicy({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      originalPolicy: selectedPolicyToDelete,
    })
  }

  return (
    <div className="flex min-h-full w-full flex-col">
      <h3 className="text-xl">存储策略</h3>
      <p className="mt-2 text-sm text-foreground-light">
        通过策略定义存储桶级别所允许的操作来保护您的文件。
      </p>

      {isLoading ? (
        <div className="flex h-full items-center justify-center">
          <Loader className="animate-spin" size={16} />
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {buckets.length === 0 && <StoragePoliciesPlaceholder />}

          {/* Sections for policies grouped by buckets */}
          {buckets.map((bucket) => {
            const bucketPolicies = get(
              find(formattedStorageObjectPolicies, { name: bucket.name }),
              ['policies'],
              []
            ).sort((a: any, b: any) => a.name.localeCompare(b.name))

            return (
              <StoragePoliciesBucketRow
                key={bucket.name}
                table="objects"
                label={bucket.name}
                bucket={bucket}
                policies={bucketPolicies}
                onSelectPolicyAdd={onSelectPolicyAdd}
                onSelectPolicyEdit={onSelectPolicyEdit}
                onSelectPolicyDelete={onSelectPolicyDelete}
              />
            )
          })}

          <div className="!mb-4 w-full border-b border-muted" />
          <p className="text-sm text-foreground-light">
            您也可以直接编写 storage 模式中表的访问策略，以实现更加精细的访问控制
          </p>

          {/* Section for policies under storage.objects that are not tied to any buckets */}
          <StoragePoliciesBucketRow
            table="objects"
            label="storage.objects 上的其他策略"
            policies={ungroupedPolicies}
            onSelectPolicyAdd={onSelectPolicyAdd}
            onSelectPolicyEdit={onSelectPolicyEdit}
            onSelectPolicyDelete={onSelectPolicyDelete}
          />

          {/* Section for policies under storage.buckets */}
          <StoragePoliciesBucketRow
            table="buckets"
            label="storage.buckets 上的策略"
            policies={storageBucketPolicies}
            onSelectPolicyAdd={onSelectPolicyAdd}
            onSelectPolicyEdit={onSelectPolicyEdit}
            onSelectPolicyDelete={onSelectPolicyDelete}
          />
        </div>
      )}

      {/* Only used for adding policies to buckets */}
      <StoragePoliciesEditPolicyModal
        visible={showStoragePolicyEditor}
        bucketName={isEditingPolicyForBucket.bucket}
        onSelectCancel={onCancelPolicyEdit}
        onCreatePolicies={onCreatePolicies}
        onSaveSuccess={onSavePolicySuccess}
      />

      {/* Adding policies to objets/buckets table or editting any policy uses the general policy editor */}
      <PolicyEditorModal
        schema="storage"
        visible={showGeneralPolicyEditor}
        table={isEditingPolicyForBucket.table}
        selectedPolicyToEdit={selectedPolicyToEdit}
        onSelectCancel={onCancelPolicyEdit}
        onCreatePolicy={onCreatePolicy}
        onUpdatePolicy={onUpdatePolicy}
        onSaveSuccess={onSavePolicySuccess}
      />

      <ConfirmModal
        danger
        visible={!isEmpty(selectedPolicyToDelete)}
        title="确定要删除策略"
        description={`本操作是永久性的！您确定要删除策略 "${selectedPolicyToDelete.name}" 吗？`}
        buttonLabel="删除"
        buttonLoadingLabel="正在删除"
        onSelectCancel={onCancelPolicyDelete}
        onSelectConfirm={onDeletePolicy}
      />
    </div>
  )
}

export default StoragePolicies
