'''
helper function to find the diff in two different list
'''
def list_diff(list1, list2):
    return (list(list(set(list1)-set(list2)) + list(set(list2)-set(list1))))